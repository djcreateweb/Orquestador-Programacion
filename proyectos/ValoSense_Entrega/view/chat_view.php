<?php require_once("view/menu.php"); ?>

<?php
// muestra el contenido del mensaje según su tipo
function render_contenido_mensaje($contenido, $tipo){
    $txt = htmlspecialchars((string)$contenido, ENT_QUOTES, 'UTF-8');
    if ($tipo == 'discord_link') {
        $raw = trim((string)$contenido);
        if (!preg_match('#^https?://#i', $raw)) $raw = 'https://' . $raw;
        return '<a class="msg-link" href="' . htmlspecialchars($raw, ENT_QUOTES) . '" target="_blank" rel="noopener noreferrer">' . $txt . '</a>';
    }
    if ($tipo == 'valorant_code' || $tipo == 'discord_id' || $tipo == 'riot_id') {
        return '<code class="msg-code">' . $txt . '</code>';
    }
    return nl2br($txt);
}
// devuelve la etiqueta del tipo de mensaje
function etiqueta_tipo($tipo){
    if ($tipo == 'valorant_code') return 'Código Valorant';
    if ($tipo == 'discord_link')  return 'Discord · servidor';
    if ($tipo == 'discord_id')    return 'Discord · ID';
    if ($tipo == 'riot_id')       return 'Riot ID · Valorant';
    return '';
}
$me_id = $_SESSION['usuario']['id'];
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

        <!-- sidebar: lista de amigos -->
        <aside class="chat-sidebar" aria-label="Lista de amigos">
            <header class="chat-sidebar-header">
                <span class="eyebrow">// MENSAJES</span>
                <h1 class="chat-sidebar-title">Amigos <span class="badge badge--muted"><?php echo count($amigos); ?></span></h1>
            </header>

            <?php if (empty($amigos)): ?>
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
                    <?php foreach ($amigos as $a): ?>
                        <?php
                            $is_active = ($amigo_actual && $a['usuario_id'] == $amigo_actual['usuario_id']);
                            $preview = '';
                            if (!empty($a['ultimo_contenido'])) {
                                $pref = ($a['ultimo_emisor'] == $me_id) ? 'Tú: ' : '';
                                $preview = $pref . mb_substr($a['ultimo_contenido'], 0, 60);
                            }
                        ?>
                        <li class="chat-friend <?php echo $is_active ? 'is-active' : ''; ?>" data-friend-id="<?php echo $a['usuario_id']; ?>">
                            <a href="index.php?controlador=chat&amp;action=home&amp;id=<?php echo $a['usuario_id']; ?>" class="chat-friend-link">
                                <span class="chat-friend-avatar">
                                    <?php echo htmlspecialchars(strtoupper(mb_substr($a['username'], 0, 2))); ?>
                                </span>
                                <span class="chat-friend-body">
                                    <span class="chat-friend-name"><?php echo htmlspecialchars($a['username']); ?></span>
                                    <span class="chat-friend-preview"><?php echo htmlspecialchars($preview ?: '—'); ?></span>
                                </span>
                                <?php if (!empty($a['unread']) && $a['unread'] > 0): ?>
                                    <span class="chat-friend-unread badge badge--glow"><?php echo $a['unread']; ?></span>
                                <?php endif; ?>
                            </a>
                        </li>
                    <?php endforeach; ?>
                </ul>
            <?php endif; ?>
        </aside>

        <!-- panel: conversación -->
        <section class="chat-panel" aria-label="Conversación">
            <?php if (!$amigo_actual): ?>
                <div class="chat-empty-panel">
                    <div class="empty-icon" aria-hidden="true">◐</div>
                    <h2 class="empty-title">Selecciona un amigo</h2>
                    <p class="empty-desc">Elige una conversación en el panel izquierdo para empezar a chatear.</p>
                </div>
            <?php else: ?>
                <header class="chat-panel-header">
                    <div class="chat-panel-identity">
                        <span class="chat-friend-avatar chat-panel-avatar">
                            <?php echo htmlspecialchars(strtoupper(mb_substr($amigo_actual['username'], 0, 2))); ?>
                        </span>
                        <div>
                            <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $amigo_actual['usuario_id']; ?>" class="chat-panel-name">
                                <?php echo htmlspecialchars($amigo_actual['username']); ?>
                            </a>
                            <p class="chat-panel-meta">
                                <?php echo htmlspecialchars($amigo_actual['rango']); ?> · <?php echo htmlspecialchars($amigo_actual['region']); ?>
                            </p>
                        </div>
                    </div>
                    <a href="index.php?controlador=perfil&amp;action=ver&amp;id=<?php echo $amigo_actual['usuario_id']; ?>" class="btn-ghost btn-small">Ver perfil</a>
                </header>

                <div class="chat-messages" id="chat-messages"
                     data-friend-id="<?php echo $amigo_actual['usuario_id']; ?>"
                     data-me-id="<?php echo $me_id; ?>">
                    <?php if (empty($mensajes)): ?>
                        <p class="chat-empty-convo">Todavía no hay mensajes. Escribe el primero.</p>
                    <?php else: ?>
                        <?php foreach ($mensajes as $m): ?>
                            <?php
                                $mine = ($m['emisor_id'] == $me_id);
                                $tipo = isset($m['tipo']) ? $m['tipo'] : 'text';
                                $etiq = etiqueta_tipo($tipo);
                            ?>
                            <div class="chat-msg <?php echo $mine ? 'chat-msg-mine' : 'chat-msg-theirs'; ?> msg-type-<?php echo htmlspecialchars($tipo); ?>">
                                <?php if ($etiq): ?>
                                    <span class="chat-msg-badge msg-badge-<?php echo htmlspecialchars($tipo); ?>"><?php echo htmlspecialchars($etiq); ?></span>
                                <?php endif; ?>
                                <div class="chat-msg-body"><?php echo render_contenido_mensaje($m['contenido'], $tipo); ?></div>
                                <time class="chat-msg-time">
                                    <?php echo htmlspecialchars(date('H:i', strtotime($m['creado_en']))); ?>
                                </time>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>

                <form class="chat-composer" id="chat-composer" action="index.php?controlador=chat&amp;action=enviar" method="post">
                    <input type="hidden" name="target_id" value="<?php echo $amigo_actual['usuario_id']; ?>">
                    <input type="hidden" name="tipo" value="auto">
                    <input type="text" name="contenido" class="chat-composer-input"
                           placeholder="Escribe un mensaje…" maxlength="2000" autocomplete="off" required>
                    <span class="chat-composer-detected" aria-live="polite" hidden></span>
                    <button type="submit" class="btn-primary chat-composer-send">Enviar</button>
                </form>
            <?php endif; ?>
        </section>

    </div>
</main>
