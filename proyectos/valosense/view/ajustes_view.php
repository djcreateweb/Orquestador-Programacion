<?php
// =====================================================
// ajustes_view.php — Vista de ajustes de cuenta
// Requiere: $user, $amigos, $estados_presencia,
//           $rangos, $regiones, $mensaje, $error
// =====================================================
require_once("view/menu.php");
require_once("model/helpers.php");
?>

<?php
    $es_ok_flash  = $mensaje !== '';
    $es_err_flash = $error !== '';
    $hay_flash    = $es_ok_flash || $es_err_flash;
    $flash_titulo  = $es_ok_flash ? $mensaje : $error;
    $flash_detalle = $es_ok_flash ? $detalle : ($detalle_error ?? '');
?>
<?php if ($hay_flash): ?>
    <!-- Toast enriquecido — position:fixed, vive fuera del flujo de la página -->
    <div class="toast toast--<?php echo $es_ok_flash ? 'ok' : 'err'; ?>"
         id="flash-toast" role="alert" aria-live="polite">
        <div class="toast-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <?php if ($es_ok_flash): ?>
                    <polyline points="20 6 9 17 4 12"></polyline>
                <?php else: ?>
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                <?php endif; ?>
            </svg>
        </div>
        <div class="toast-body">
            <p class="toast-title"><?php echo htmlspecialchars($flash_titulo); ?></p>
            <?php if ($flash_detalle !== ''): ?>
                <p class="toast-detail"><?php echo htmlspecialchars($flash_detalle); ?></p>
            <?php endif; ?>
        </div>
        <button type="button" class="toast-close" aria-label="Cerrar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
        <div class="toast-progress" aria-hidden="true"></div>
    </div>
<?php endif; ?>

<main class="main-content" id="main">

    <!-- Migas de pan -->
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Ajustes</li>
            </ol>
        </div>
    </nav>

    <!-- Hero compacto -->
    <section class="hero hero--compact">
        <div class="container hero-content">
            <span class="eyebrow">// CUENTA · AJUSTES</span>
            <h1 class="hero-title hero-title--sm">Tus <span class="text-red">ajustes</span></h1>
            <p class="hero-subtitle">Gestiona tu presencia, contraseña, amigos y cuenta Valorant vinculada.</p>
        </div>
    </section>

    <!-- Contenido principal -->
    <div class="container">
        <div class="ajustes-grid">

            <!-- ===================== SECCION: PRESENCIA ===================== -->
            <section class="ajustes-card" id="presencia" aria-labelledby="title-presencia">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// ESTADO</span>
                    <h2 class="section-title" id="title-presencia">Estado de presencia</h2>
                </header>

                <form method="post"
                      action="index.php?controlador=usuario&amp;action=cambiar_presencia"
                      aria-label="Cambiar estado de presencia"
                      data-keep-scroll>
                    <?php echo csrf_field(); ?>

                    <fieldset class="presence-fieldset">
                        <legend class="sr-only">Elige tu estado de presencia</legend>
                        <div class="presence-options">

                            <!-- En linea -->
                            <div class="presence-option">
                                <input type="radio"
                                       id="p-en_linea"
                                       name="estado"
                                       value="en_linea"
                                       <?php echo ($user['estado_presencia'] ?? '') === 'en_linea' ? 'checked' : ''; ?>>
                                <label for="p-en_linea">
                                    <span class="status-dot status-dot--inline status-online" aria-hidden="true"></span>
                                    <span>En linea</span>
                                </label>
                            </div>

                            <!-- Ausente -->
                            <div class="presence-option">
                                <input type="radio"
                                       id="p-ausente"
                                       name="estado"
                                       value="ausente"
                                       <?php echo ($user['estado_presencia'] ?? '') === 'ausente' ? 'checked' : ''; ?>>
                                <label for="p-ausente">
                                    <span class="status-dot status-dot--inline status-away" aria-hidden="true"></span>
                                    <span>Ausente</span>
                                </label>
                            </div>

                            <!-- Invisible -->
                            <div class="presence-option">
                                <input type="radio"
                                       id="p-invisible"
                                       name="estado"
                                       value="invisible"
                                       <?php echo ($user['estado_presencia'] ?? '') === 'invisible' ? 'checked' : ''; ?>>
                                <label for="p-invisible">
                                    <span class="status-dot status-dot--inline status-dot--invisible" aria-hidden="true"></span>
                                    <span>Invisible</span>
                                </label>
                            </div>

                        </div>
                    </fieldset>

                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-primary">Guardar presencia</button>
                    </div>
                </form>
            </section>

            <!-- ===================== SECCION: DATOS BASICOS ===================== -->
            <section class="ajustes-card" id="datos" aria-labelledby="title-datos">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// PERFIL</span>
                    <h2 class="section-title" id="title-datos">Datos basicos</h2>
                </header>

                <form method="post"
                      action="index.php?controlador=usuario&amp;action=editar_datos"
                      aria-label="Editar datos basicos"
                      data-keep-scroll>
                    <?php echo csrf_field(); ?>

                    <div class="ajustes-form-grid">
                        <div class="form-group">
                            <label class="filter-label" for="username">Nombre de usuario</label>
                            <?php $es_google_user = !empty($user['google_id'] ?? null); ?>
                            <input type="text"
                                   id="username"
                                   name="username"
                                   class="form-input<?php echo $es_google_user ? ' is-readonly' : ''; ?>"
                                   value="<?php echo htmlspecialchars($user['username'] ?? ''); ?>"
                                   maxlength="30"
                                   <?php if ($es_google_user): ?>readonly tabindex="-1"<?php else: ?>required aria-required="true"<?php endif; ?>>
                            <?php if ($es_google_user): ?>
                                <small class="form-hint">Tu nombre de usuario lo asigna Google y no se puede cambiar.</small>
                            <?php endif; ?>
                        </div>

                        <div class="form-group">
                            <label class="filter-label" for="email">Correo electronico</label>
                            <input type="email"
                                   id="email"
                                   name="email"
                                   class="form-input"
                                   value="<?php echo htmlspecialchars($user['email'] ?? ''); ?>"
                                   required
                                   aria-required="true">
                        </div>

                        <div class="form-group">
                            <label class="filter-label" for="rango">Rango</label>
                            <select id="rango" name="rango" class="filter-select" required>
                                <?php foreach ($rangos as $r): ?>
                                    <option value="<?php echo htmlspecialchars($r); ?>"
                                        <?php echo ($user['rango'] ?? '') === $r ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($r); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="filter-label" for="region">Region</label>
                            <select id="region" name="region" class="filter-select" required>
                                <?php foreach ($regiones as $reg): ?>
                                    <option value="<?php echo htmlspecialchars($reg); ?>"
                                        <?php echo ($user['region'] ?? '') === $reg ? 'selected' : ''; ?>>
                                        <?php echo htmlspecialchars($reg); ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                    </div>

                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-primary">Guardar cambios</button>
                    </div>
                </form>
            </section>

            <!-- ===================== SECCION: CONTRASENA ===================== -->
            <section class="ajustes-card" id="password" aria-labelledby="title-password">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// SEGURIDAD</span>
                    <h2 class="section-title" id="title-password">Cambiar contrasena</h2>
                </header>

                <form method="post"
                      action="index.php?controlador=usuario&amp;action=cambiar_password"
                      aria-label="Cambiar contrasena"
                      data-keep-scroll>
                    <?php echo csrf_field(); ?>

                    <div class="ajustes-form-grid ajustes-form-grid--single">
                        <div class="form-group">
                            <label class="filter-label" for="actual">Contrasena actual</label>
                            <input type="password"
                                   id="actual"
                                   name="actual"
                                   class="form-input"
                                   required
                                   aria-required="true"
                                   autocomplete="current-password">
                        </div>

                        <div class="form-group">
                            <label class="filter-label" for="nueva">Nueva contrasena</label>
                            <input type="password"
                                   id="nueva"
                                   name="nueva"
                                   class="form-input"
                                   required
                                   aria-required="true"
                                   minlength="8"
                                   autocomplete="new-password">
                        </div>

                        <div class="form-group">
                            <label class="filter-label" for="confirmar">Confirmar nueva contrasena</label>
                            <input type="password"
                                   id="confirmar"
                                   name="confirmar"
                                   class="form-input"
                                   required
                                   aria-required="true"
                                   minlength="8"
                                   autocomplete="new-password">
                        </div>
                    </div>

                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-primary">Cambiar contrasena</button>
                    </div>
                </form>
            </section>

            <!-- ===================== SECCION: AMIGOS ===================== -->
            <section class="ajustes-card" id="amigos" aria-labelledby="title-amigos">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// SOCIAL</span>
                    <h2 class="section-title" id="title-amigos">
                        Mis amigos
                        <?php if (!empty($amigos)): ?>
                            <span class="badge badge--cyan"><?php echo count($amigos); ?></span>
                        <?php endif; ?>
                    </h2>
                </header>

                <?php if (empty($amigos)): ?>
                    <div class="empty-state empty-state--inline">
                        <div class="empty-icon" aria-hidden="true">◎</div>
                        <p class="empty-desc">Aun no tienes amigos en ValoSense.</p>
                    </div>
                <?php else: ?>
                    <ul class="amigos-list" aria-label="Lista de amigos">
                        <?php foreach ($amigos as $amigo): ?>
                            <?php
                                $pa = presencia_visible(
                                    $amigo['estado_presencia'] ?? null,
                                    $amigo['ultima_actividad'] ?? null
                                );
                                $inicial_a = strtoupper(substr($amigo['username'] ?? '?', 0, 2));
                            ?>
                            <li class="amigo-item" data-amigo-row>
                                <div class="amigo-avatar-wrap">
                                    <div class="amigo-avatar"><?php echo htmlspecialchars($inicial_a); ?></div>
                                    <?php if ($pa === 'en_linea'): ?>
                                        <span class="status-dot status-online" aria-label="En linea"></span>
                                    <?php elseif ($pa === 'ausente'): ?>
                                        <span class="status-dot status-away" aria-label="Ausente"></span>
                                    <?php endif; ?>
                                </div>

                                <div class="amigo-info">
                                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo (int)$amigo['id']; ?>"
                                       class="amigo-username">
                                        <?php echo htmlspecialchars($amigo['username']); ?>
                                    </a>
                                    <span class="amigo-meta">
                                        <?php if (!empty($amigo['rango'])): ?>
                                            <span class="rank-badge"><?php echo htmlspecialchars($amigo['rango']); ?></span>
                                        <?php endif; ?>
                                        <?php if (!empty($amigo['region'])): ?>
                                            <span class="amigo-region"><?php echo htmlspecialchars($amigo['region']); ?></span>
                                        <?php endif; ?>
                                    </span>
                                </div>

                                <form class="inline-form amigo-delete-form"
                                      method="post"
                                      action="index.php?controlador=amistad&amp;action=eliminar"
                                      data-keep-scroll
                                      data-confirm="¿Quitar a <?php echo htmlspecialchars($amigo['username'], ENT_QUOTES); ?> de tu lista de amigos?">
                                    <?php echo csrf_field(); ?>
                                    <input type="hidden" name="id" value="<?php echo (int)$amigo['relacion_id']; ?>">
                                    <input type="hidden" name="redirect" value="index.php?controlador=usuario&action=ajustes">
                                    <button type="submit" class="btn-secondary btn-small">Eliminar</button>
                                </form>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                <?php endif; ?>
            </section>

            <!-- ===================== SECCION: CUENTA VALORANT ===================== -->
            <section class="ajustes-card" id="riot" aria-labelledby="title-riot">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// RIOT</span>
                    <h2 class="section-title" id="title-riot">Cuenta de Valorant vinculada</h2>
                </header>

                <?php if (!empty($user['riot_id'])): ?>
                    <div class="riot-info">
                        <p class="riot-id-display">
                            <span class="eyebrow">// RIOT ID</span>
                            <strong><?php echo htmlspecialchars($user['riot_id']); ?>
                                <?php if (!empty($user['riot_tag'])): ?>
                                    #<?php echo htmlspecialchars($user['riot_tag']); ?>
                                <?php endif; ?>
                            </strong>
                            <?php if (!empty($user['riot_region'])): ?>
                                <span class="amigo-region"><?php echo htmlspecialchars(strtoupper($user['riot_region'])); ?></span>
                            <?php endif; ?>
                        </p>
                    </div>
                <?php else: ?>
                    <p class="ajustes-text-muted">No tienes ninguna cuenta de Valorant vinculada todavia.</p>
                <?php endif; ?>

                <div class="ajustes-card-footer">
                    <a href="index.php?controlador=usuario&amp;action=vincular"
                       class="btn-primary"
                       aria-label="Gestionar vinculacion de cuenta Valorant">
                        Gestionar
                    </a>
                </div>

                <!-- Toggle: visibilidad del Riot ID para amigos -->
                <form class="ajustes-subsection"
                      action="index.php?controlador=usuario&amp;action=cambiar_visibilidad_riot"
                      method="post" data-keep-scroll>
                    <?php echo csrf_field(); ?>
                    <label class="ajustes-toggle">
                        <input type="checkbox" name="riot_id_visible" value="1"
                               <?php echo ((int)($user['riot_id_visible'] ?? 1) === 1) ? 'checked' : ''; ?>>
                        <span class="ajustes-toggle-switch" aria-hidden="true"></span>
                        <span class="ajustes-toggle-body">
                            <span class="ajustes-toggle-title">Mostrar mi Riot ID a mis amigos</span>
                            <span class="ajustes-toggle-desc">Si está desactivado, tus amigos no verán tu Riot ID en tu perfil y tendrán que pedírtelo por el chat.</span>
                        </span>
                    </label>
                    <div class="filter-actions">
                        <button type="submit" class="btn-primary btn-small">Guardar</button>
                    </div>
                </form>

            </section>

            <!-- ===================== SECCION: VINCULACIONES (GOOGLE) ===================== -->
            <section class="ajustes-card" id="vinculaciones" aria-labelledby="title-vinculaciones">
                <header class="ajustes-card-header">
                    <span class="eyebrow">// ACCESO</span>
                    <h2 class="section-title" id="title-vinculaciones">Vinculaciones externas</h2>
                </header>

                <div class="ajustes-subsection">
                    <h3 class="ajustes-subtitle">Cuenta de Google</h3>
                    <?php if (!empty($user['google_id'])): ?>
                        <p class="ajustes-link-state ajustes-link-state--on">
                            <span class="dot-ok" aria-hidden="true"></span>
                            Tu cuenta está vinculada con Google.
                        </p>
                    <?php else: ?>
                        <p class="ajustes-link-state">
                            Vincula tu cuenta Google para iniciar sesión con un clic.
                        </p>
                        <a class="btn-secondary btn-small btn-google-link"
                           href="index.php?controlador=usuario&amp;action=vincular_google">
                            Vincular Google
                        </a>
                    <?php endif; ?>
                </div>
            </section>

            <!-- ===================== SECCION: ZONA DE PELIGRO ===================== -->
            <section class="ajustes-card ajustes-card--danger" id="peligro" aria-labelledby="title-peligro">
                <header class="ajustes-card-header">
                    <span class="eyebrow eyebrow--danger">// PELIGRO</span>
                    <h2 class="section-title" id="title-peligro">Zona de peligro</h2>
                </header>

                <p class="ajustes-danger-warn">
                    <strong>Atencion:</strong> Eliminar tu cuenta es una accion permanente e irreversible.
                    Perderds todos tus datos, amigos, lineups favoritos y estadisticas.
                    Esta accion no se puede deshacer.
                </p>

                <form method="post"
                      action="index.php?controlador=usuario&amp;action=eliminar_cuenta"
                      aria-label="Eliminar cuenta de forma permanente"
                      data-keep-scroll
                      data-confirm="Esta acción es IRREVERSIBLE. Se borrarán todos tus datos. ¿Seguro que quieres eliminar tu cuenta?">
                    <?php echo csrf_field(); ?>

                    <div class="form-group">
                        <label class="filter-label" for="password_confirm">
                            Introduce tu contrasena para confirmar
                        </label>
                        <input type="password"
                               id="password_confirm"
                               name="password_confirm"
                               class="form-input form-input--danger"
                               required
                               aria-required="true"
                               autocomplete="current-password"
                               placeholder="Tu contrasena actual">
                    </div>

                    <div class="ajustes-card-footer">
                        <button type="submit" class="btn-danger">Eliminar mi cuenta</button>
                    </div>
                </form>
            </section>

        </div><!-- /.ajustes-grid -->
    </div><!-- /.container -->

</main>

<!-- Interceptor AJAX para forms de ajustes + gestión del toast -->
<script>
(function () {
    var CIERRE_MS = 2000;
    var SALIDA_MS = 200;

    // Retira el toast con animación de salida y lo elimina del DOM
    function cerrarToast(t) {
        if (!t || t.dataset.leaving === '1') return;
        t.dataset.leaving = '1';
        t.classList.add('is-leaving');
        setTimeout(function () {
            if (t.parentNode) t.parentNode.removeChild(t);
        }, SALIDA_MS + 40);
    }

    // Asocia botón de cierre y temporizador de auto-dismiss al toast dado
    function atarToast(t) {
        if (!t) return;
        var btn = t.querySelector('.toast-close');
        if (btn) btn.addEventListener('click', function () { cerrarToast(t); });
        setTimeout(function () { cerrarToast(t); }, CIERRE_MS);
    }

    // Toast server-side (si venimos de un redirect antiguo)
    atarToast(document.getElementById('flash-toast'));

    // Interceptar submit de todos los forms con data-keep-scroll
    document.querySelectorAll('form[data-keep-scroll]').forEach(function (form) {
        if (form.method.toLowerCase() !== 'post') return;

        form.addEventListener('submit', function (e) {
            e.preventDefault();

            var esEliminarCuenta = form.action.indexOf('eliminar_cuenta') > -1;
            var esCambiarPass    = form.action.indexOf('cambiar_password') > -1;
            var filaAmigo        = form.closest('[data-amigo-row]');

            // Deshabilitar botón submit para evitar dobles envíos
            var submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            var fd = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: fd,
                credentials: 'same-origin',
                redirect: 'follow',
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(function (r) { return r.text(); })
            .then(function (html) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                var nuevo = doc.getElementById('flash-toast');

                // Retirar toast antiguo si existe
                var viejo = document.getElementById('flash-toast');
                if (viejo) viejo.remove();

                if (nuevo) {
                    document.body.appendChild(nuevo);
                    atarToast(nuevo);

                    // Acciones tras éxito
                    if (nuevo.classList.contains('toast--ok')) {
                        if (filaAmigo) filaAmigo.remove();
                        if (esCambiarPass) form.reset();
                        if (esEliminarCuenta) {
                            setTimeout(function () {
                                location.href = 'index.php?controlador=usuario&action=login';
                            }, CIERRE_MS + 200);
                            return;
                        }
                    }
                }

                if (submitBtn) submitBtn.disabled = false;
            })
            .catch(function () {
                // Si falla el fetch, submit tradicional como fallback
                if (submitBtn) submitBtn.disabled = false;
                form.submit();
            });
        });
    });
})();
</script>
