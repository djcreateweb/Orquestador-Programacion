/*
 * Firebase opcional para MCU Tracker.
 * La app sigue funcionando en local si firebase-config.js está vacío.
 * SDK modular cargado bajo demanda desde el CDN oficial.
 */
const FIREBASE_SDK_VERSION='12.16.0';
const firebaseConfig=window.MCU_FIREBASE_CONFIG||{};
const authButton=document.getElementById('authButton');
const authButtonLabel=document.getElementById('authButtonLabel');
const authStatus=document.getElementById('authStatus');
const authUser=document.getElementById('authUser');
const authAvatar=document.getElementById('authAvatar');
const authUserName=document.getElementById('authUserName');
const authGate=document.getElementById('authGate');
const authGateButton=document.getElementById('authGateButton');
const authGateLocal=document.getElementById('authGateLocal');
const authGateStatus=document.getElementById('authGateStatus');
let firebaseAuth=null;
let firestoreDb=null;
let currentUser=null;
let saveTimer=null;
let saveInFlight=false;
let queuedSnapshot=null;
let authGateBypass=false;
let firebaseReady=false;
let firebaseStartPromise=null;
let googleProvider=null;
let signInWithPopupFn=null;
let signInWithRedirectFn=null;
let signOutFn=null;
let signInInProgress=false;
let authStateResolved=false;

function isConfigured(config){
  return ['apiKey','authDomain','projectId','appId'].every(function(key){
    return typeof config[key]==='string' && config[key].trim() && config[key].indexOf('REEMPLAZA')===-1;
  });
}

function emit(name,detail){
  window.dispatchEvent(new CustomEvent(name,{detail:detail||{}}));
}

function setStatus(text,isError){
  if(!authStatus) return;
  authStatus.textContent=text;
  authStatus.classList.toggle('is-error',!!isError);
  setGateStatus(text,isError);
}

function setGateStatus(text,isError){
  if(!authGateStatus) return;
  authGateStatus.textContent=text;
  authGateStatus.classList.toggle('is-error',!!isError);
}

function setGateVisible(visible){
  if(!authGate) return;
  authGate.hidden=!visible;
  document.body.classList.toggle('auth-gate-open',!!visible);
}

function setAuthBusy(busy){
  if(authButton) authButton.disabled=!!busy;
  if(authGateButton){
    authGateButton.disabled=!!busy;
    authGateButton.setAttribute('aria-busy',busy?'true':'false');
  }
}

function authErrorMessage(error){
  const code=error&&error.code||'';
  if(code==='auth/popup-blocked') return 'Chrome ha bloqueado la ventana. Permite ventanas emergentes para este sitio y vuelve a pulsar.';
  if(code==='auth/operation-not-allowed' || code==='auth/configuration-not-found') return 'Activa Google en Firebase > Authentication > Método de acceso.';
  if(code==='auth/unauthorized-domain') return 'Autoriza este dominio en Firebase > Authentication > Configuración > Dominios.';
  if(code==='auth/popup-blocked') return 'El navegador bloqueó la ventana de Google. Se intentará abrir en esta pestaña.';
  if(code==='auth/popup-closed-by-user' || code==='auth/cancelled-popup-request') return 'La ventana de Google se cerró antes de iniciar sesión.';
  if(code==='auth/network-request-failed') return 'No hay conexión con Google. Comprueba Internet y vuelve a intentarlo.';
  return 'No se pudo iniciar sesión con Google.';
}

async function handleGoogleSignIn(){
  if(signInInProgress) return;
  signInInProgress=true;
  setAuthBusy(true);
  setStatus('Preparando acceso con Google…',false);
  try{
    if(!firebaseReady) throw new Error('Firebase todavía está cargando.');
    if(!firebaseAuth || !googleProvider || !signInWithPopupFn || !signInWithRedirectFn) throw new Error('Firebase todavía no está listo.');
    setStatus('Abriendo Google…',false);
    try{
      await signInWithPopupFn(firebaseAuth,googleProvider);
    }catch(error){
      if(error&&error.code==='auth/popup-blocked'){
        setStatus('El navegador bloqueó la ventana. Continuando…',false);
        throw error;
      }else{
        throw error;
      }
    }
  }catch(error){
    console.error('Google Sign-In falló.',error);
    setStatus(authErrorMessage(error),true);
    setAuthBusy(false);
    signInInProgress=false;
  }
}

function updateUserUi(user){
  if(!user){
    if(authUser) authUser.hidden=true;
    if(authButton) authButton.hidden=false;
    if(authButtonLabel) authButtonLabel.textContent='Entrar con Google';
    if(isConfigured(firebaseConfig) && authStateResolved && !authGateBypass) setGateVisible(true);
    return;
  }
  if(authUser){
    authUser.hidden=false;
    if(authAvatar){
      authAvatar.src=user.photoURL||'';
      authAvatar.alt=user.displayName||'Cuenta Google';
    }
    if(authUserName) authUserName.textContent=user.displayName||user.email||'Cuenta Google';
  }
  if(authButton){ authButton.hidden=false; }
  authGateBypass=false;
  setGateVisible(false);
  if(authButtonLabel) authButtonLabel.textContent='Cerrar sesión';
}

function localSnapshot(){
  return typeof window.mcuGetSnapshot==='function'
    ? window.mcuGetSnapshot()
    : {seen:[],ratings:{}};
}

async function saveSnapshot(snapshot){
  if(!currentUser || !firestoreDb) return;
  queuedSnapshot=snapshot||localSnapshot();
  if(saveInFlight) return;
  saveInFlight=true;
  const data=queuedSnapshot;
  queuedSnapshot=null;
  try{
    const {doc,setDoc,serverTimestamp}=await import('https://www.gstatic.com/firebasejs/'+FIREBASE_SDK_VERSION+'/firebase-firestore.js');
    await setDoc(doc(firestoreDb,'users',currentUser.uid),{
      schemaVersion:1,
      seen:Array.isArray(data.seen)?data.seen:[],
      ratings:data.ratings&&typeof data.ratings==='object'?data.ratings:{},
      progressPercent:Number.isFinite(Number(data.progressPercent)) ? Number(data.progressPercent) : 0,
      profile:{
        displayName:currentUser.displayName||'',
        email:currentUser.email||'',
        photoURL:currentUser.photoURL||''
      },
      updatedAt:serverTimestamp()
    },{merge:true});
    setStatus('Sincronizado con Google',false);
  }catch(error){
    console.error('No se pudo guardar el perfil de MCU Tracker en Firestore.',error);
    setStatus('Error al sincronizar',true);
  }finally{
    saveInFlight=false;
    if(queuedSnapshot) saveSnapshot(queuedSnapshot);
  }
}

function scheduleSave(snapshot){
  clearTimeout(saveTimer);
  saveTimer=setTimeout(function(){ saveSnapshot(snapshot); },350);
}

async function startFirebase(){
  try{
    const [{initializeApp},{getAuth,onAuthStateChanged,GoogleAuthProvider,signInWithPopup,signInWithRedirect,getRedirectResult,signOut},firestore]=await Promise.all([
      import('https://www.gstatic.com/firebasejs/'+FIREBASE_SDK_VERSION+'/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/'+FIREBASE_SDK_VERSION+'/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/'+FIREBASE_SDK_VERSION+'/firebase-firestore.js')
    ]);
    const app=initializeApp(firebaseConfig);
    firebaseAuth=getAuth(app);
    firestoreDb=firestore.getFirestore(app);
    googleProvider=new GoogleAuthProvider();
    signInWithPopupFn=signInWithPopup;
    signInWithRedirectFn=signInWithRedirect;
    signOutFn=signOut;
    firebaseReady=true;
    setAuthBusy(false);

    authButton.addEventListener('click',async function(){
      authButton.disabled=true;
      try{
        if(currentUser){
          await signOut(firebaseAuth);
          return;
        }
        if(true){
          await signInWithPopupFn(firebaseAuth,googleProvider);
        }
      }catch(error){
        console.error('Google Sign-In falló.',error);
        setStatus('No se pudo iniciar sesión',true);
      }finally{
        authButton.disabled=false;
      }
    });

    window.addEventListener('mcu-local-change',function(event){
      if(currentUser) scheduleSave(event.detail||localSnapshot());
    });

    onAuthStateChanged(firebaseAuth,async function(user){
      currentUser=user||null;
      authStateResolved=true;
      updateUserUi(currentUser);
      setAuthBusy(false);
      signInInProgress=false;
      emit('mcu-auth-status',{user:currentUser});
      if(!currentUser){
        setStatus('Solo este dispositivo',false);
        return;
      }
      setStatus('Cargando nube…',false);
      try{
        const snap=await firestore.getDoc(firestore.doc(firestoreDb,'users',currentUser.uid));
        if(snap.exists()){
          const data=snap.data();
          emit('mcu-cloud-load',{
            seen:Array.isArray(data.seen)?data.seen:[],
            ratings:data.ratings||{},
            progressPercent:Number.isFinite(Number(data.progressPercent)) ? Number(data.progressPercent) : 0
          });
          scheduleSave(localSnapshot());
          setStatus('Sincronizado con Google',false);
        }else{
          await saveSnapshot(localSnapshot());
        }
      }catch(error){
        console.error('No se pudo cargar el perfil de MCU Tracker desde Firestore.',error);
        setStatus('Error al cargar la nube',true);
      }
    });

    getRedirectResult(firebaseAuth).catch(function(error){
      console.error('No se pudo completar el acceso Google redirigido.',error);
      setStatus('No se pudo iniciar sesión',true);
    });
    emit('mcu-firebase-ready',{enabled:true});
  }catch(error){
    console.error('Firebase no pudo inicializarse.',error);
    if(authButton) authButton.disabled=false;
    setStatus('Firebase no disponible',true);
    setGateStatus('Firebase no disponible. Revisa la configuración.',true);
    emit('mcu-firebase-ready',{enabled:false,error:error});
  }
}

// Se conecta fuera de startFirebase para que el primer clic nunca se pierda
// mientras se descargan los módulos del SDK.
if(authGateButton) authGateButton.addEventListener('click',handleGoogleSignIn);

if(authGateLocal) authGateLocal.addEventListener('click',function(){
  authGateBypass=true;
  setGateVisible(false);
  setStatus('Solo este dispositivo',false);
});

if(!isConfigured(firebaseConfig)){
  setGateVisible(false);
  if(authButton){
    authButton.addEventListener('click',function(){
      setStatus('Completa js/firebase-config.js',true);
    });
  }
  emit('mcu-firebase-ready',{enabled:false,reason:'missing-config'});
}else{
  setStatus('Conectando con Firebase…',false);
  setAuthBusy(true);
  setGateStatus('Conectando con Firebase...',false);
  firebaseStartPromise=startFirebase();
}
