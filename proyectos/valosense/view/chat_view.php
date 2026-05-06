<?php require_once("view/menu.php"); require_once("model/helpers.php"); ?>

<?php
// Helper local: render seguro del contenido de un mensaje según su tipo
function render_contenido_mensaje($contenido, $tipo){
    $txt = htmlspecialchars((string)$contenido, ENT_QUOTES, 'UTF-8');
    switch($tipo){
        case 'discord_link':
            // Normaliza a URL con protocolo si venía suelta (discord.gg/xxx)
            $raw = trim((string)$contenido);
            if(!preg_match('#^https?://#i', $raw)) $raw = 'https://' . $raw;
            $url = safe_discord_link($raw);
            if($url === 'about:blank') return $txt;
            return '<a class="msg-link" href="' . htmlspecialchars($url, ENT_QUOTES) . '" target="_blank" rel="noopener noreferrer">' . $txt . '</a>';
        case 'valorant_code':
        case 'discord_id':
        case 'riot_id':
            return '<code class="msg-code">' . $txt . '</code>';
        default:
            return nl2br($txt);
    }
}
function etiqueta_tipo($tipo){
    switch($tipo){
        case 'valorant_code': return 'Código Valorant';
        case 'discord_link':  return 'Discord · servidor';
        case 'discord_id':    return 'Discord · ID';
        case 'riot_id':       return 'Riot ID · Valorant';
        default: return '';
    }
}
$me_id = (int)$_SESSION['usuario']['id'];
?>

<main class="main-content chat-main" id="main">
    <nav class="breadcrumb" aria-label="Migas de pan">
        <div class="container">
            <ol class="breadcrumb-list">
                <li class="breadcrumb-item"><a href="index.php">Inicio</a></li>
                <li class="breadcrumb-item"><a href="index.php?controlador=amistad&amp;action=amigos">Amigos</a></li>
                <li class="breadcrumb-item breadcrumb-current" aria-current="page">Mensajes</li>
            </ol>
        </div>
    </nav>

    <div class="chat-layout" id="chat-layout">

        <!-- ============== Sidebar: lista de amigos ============== -->
        <aside class="chat-sidebar" aria-label="Lista de amigos">
            <header class="chat-sidebar-header">
                <span class="eyebrow">// MENSAJES</span>
                <h1 class="chat-sidebar-title">Amigos <span class="badge badge--muted" id="chat-total-friends"><?php echo count($amigos); ?></span></h1>
            </header>

            <?php if(empty($amigos)): ?>
                <div class="empty-state spaced-top-lg">
                    <div class="empty-icon" aria-hidden="true">◎</div>
                    <h3 class="empty-title">Sin amigos todavía</h3>
                    <p class="empty-desc">Añade amigos para empezar a chatear.</p>
                    <div class="spaced-actions">
                        <a href="index.php?controlador=amistad&amp;action=amigos" class="btn-primary btn-small">Ir a amigos</a>
                    </div>
                </div>
            <?php else: ?>
                <ul class="chat-friends" id="chat-friends">
                    <?php foreach($amigos as $a): ?>
                        <?php
                            $is_active = ($amigo_actual && (int)$a['usuario_id'] === (int)$amigo_actual['usuario_id']);
                            $preview = '';
                            if(!empty($a['ultimo_contenido'])){
                                $pref = ((int)$a['ultimo_emisor'] === $me_id) ? 'Tú: ' : '';
                                $preview = $pref . mb_substr($a['ultimo_contenido'], 0, 60);
                            }
                        ?>
                        <li class="chat-friend <?php echo $is_active ? 'is-active' : ''; ?> <?php echo !empty($a['online']) ? 'is-online' : ''; ?>"
                            data-friend-id="<?php echo (int)$a['usuario_id']; ?>">
                            <a href="index.php?controlador=chat&amp;action=home&amp;id=<?php echo (int)$a['usuario_id']; ?>" class="chat-friend-link">
                                <span class="chat-friend-avatar">
                                    <?php echo htmlspecialchars(strtoupper(mb_substr($a['username'], 0, 2))); ?>
                                    <span class="chat-friend-status" aria-label="<?php echo !empty($a['online']) ? 'En línea' : 'Desconectado'; ?>"></span>
                                </span>
                                <span class="chat-friend-body">
                                    <span class="chat-friend-name"><?php echo htmlspecialchars($a['username']); ?></span>
                                    <span class="chat-friend-preview"><?php echo htmlspecialchars($preview ?: '—'); ?></span>
                                </span>
                                <?php if(!empty($a['unread']) && (int)$a['unread'] > 0): ?>
                                    <span class="chat-friend-unread badge badge--glow"><?php echo (int)$a['unread']; ?></span>
                                <?php endif; ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </aside>

        <!-- ============== Panel: conversación ============== -->
        <section class="chat-panel" aria-label="Conversación">
            <?php if(!$amigo_actual): ?>
                <div class="chat-empty-panel">
                    <div class="empty-icon" aria-hidden="true">◐</div>
                    <h2 class="empty-title">Selecciona un amigo</h2>
                    <p class="empty-desc">Elige una conversación en el panel izquierdo para empezar a chatear. Puedes enviar texto, códigos de Valorant, links de Discord o Discord IDs.</p>
                </div>
            <?php else: ?>
                <header class="chat-panel-header">
                    <div class="chat-panel-identity">
                        <span class="chat-friend-avatar chat-panel-avatar">
                            <?php echo htmlspecialchars(strtoupper(mb_substr($amigo_actual['username'], 0, 2))); ?>
                            <span class="chat-friend-status" aria-hidden="true"></span>
                        </span>
                        <div>
                            <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo (int)$amigo_actual['usuario_id']; ?>" class="chat-panel-name">
                                <?php echo htmlspecialchars($amigo_actual['username']); ?>
                            </a>
                            <p class="chat-panel-meta">
                                <?php echo htmlspecialchars($amigo_actual['rango']); ?> · <?php echo htmlspecialchars($amigo_actual['region']); ?>
                                <span class="chat-panel-presence <?php echo !empty($amigo_actual['online']) ? 'is-online' : ''; ?>">
                                    <?php echo !empty($amigo_actual['online']) ? '● Online' : '○ Offline'; ?>
                                </span>
                            </p>
                        </div>
                    </div>
                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo (int)$amigo_actual['usuario_id']; ?>" class="btn-ghost btn-small">Ver perfil</a>
                </header>

                <?php
                    $ultimo_msg_id = 0;
                    if (!empty($mensajes)) {
                        $ultimo_msg = end($mensajes);
                        $ultimo_msg_id = isset($ultimo_msg['id']) ? (int)$ultimo_msg['id'] : 0;
                    }
                ?>
                <div class="chat-messages" id="chat-messages"
                     data-friend-id="<?php echo (int)$amigo_actual['usuario_id']; ?>"
                     data-last-id="<?php echo $ultimo_msg_id; ?>"
                     data-me-id="<?php echo $me_id; ?>">
                    <?php if(empty($mensajes)): ?>
                        <p class="chat-empty-convo">Todavía no hay mensajes. Escribe el primero.</p>
                    <?php else: ?>
                        <?php foreach($mensajes as $m): ?>
                            <?php
                                $mine = ((int)$m['emisor_id'] === $me_id);
                                $tipo = $m['tipo'] ?? 'text';
                                $etiq = etiqueta_tipo($tipo);
                            ?>
                            <div class="chat-msg <?php echo $mine ? 'chat-msg-mine' : 'chat-msg-theirs'; ?> msg-type-<?php echo htmlspecialchars($tipo); ?>"
                                 data-msg-id="<?php echo (int)$m['id']; ?>">
                                <?php if($etiq): ?>
                                    <span class="chat-msg-badge msg-badge-<?php echo htmlspecialchars($tipo); ?>"><?php echo htmlspecialchars($etiq); ?></span>
                                <?php endif; ?>
                                <div class="chat-msg-body"><?php echo render_contenido_mensaje($m['contenido'], $tipo); ?></div>
                                <time class="chat-msg-time" datetime="<?php echo htmlspecialchars($m['creado_en']); ?>">
                                    <?php echo htmlspecialchars(date('H:i', strtotime($m['creado_en']))); ?>
                                </time>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <form class="chat-composer" action="index.php?controlador=chat&amp;action=enviar" method="post" id="chat-composer">
                    <?php echo csrf_field(); ?>
                    <input type="hidden" name="target_id" value="<?php echo (int)$amigo_actual['usuario_id']; ?>">

                    <select name="tipo" class="chat-composer-type" title="Tipo de mensaje">
                        <option value="auto">Auto</option>
                        <option value="text">Texto</option>
                        <option value="valorant_code">Código Valorant</option>
                        <option value="riot_id">Riot ID</option>
                        <option value="discord_link">Servidor Discord</option>
                        <option value="discord_id">Discord ID</option>
                    </select>

                    <input type="text" name="contenido" class="chat-composer-input"
                           placeholder="Mensaje, Nombre#TAG, #CODIGO o discord.gg/…"
                           maxlength="2000" autocomplete="off" required>

                    <button type="submit" class="btn-primary chat-composer-send">Enviar</button>
                </form>
            <?php endif; ?>
        </section>
    </div>
</main>
