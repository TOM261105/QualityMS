<?php
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
  header("Location: contacto.html");
  exit;
}

function limpiar($dato) {
  return htmlspecialchars(trim($dato ?? ""), ENT_QUOTES, "UTF-8");
}

$nombre = limpiar($_POST["nombre"] ?? "");
$apellido = limpiar($_POST["apellido"] ?? "");
$correo = limpiar($_POST["correo"] ?? "");
$telefono = limpiar($_POST["telefono"] ?? "");
$compania = limpiar($_POST["compania"] ?? "");
$mensaje = limpiar($_POST["mensaje"] ?? "");
$productos = limpiar($_POST["productos_cotizacion"] ?? "");

$para = "contacto@qualityms.com.mx";
$asunto = "Nueva solicitud de cotización - Quality Medical Service";

$contenido = "Nueva solicitud desde el sitio web de Quality Medical Service\n\n";
$contenido .= "Nombre: $nombre $apellido\n";
$contenido .= "Correo: $correo\n";
$contenido .= "Teléfono: $telefono\n";
$contenido .= "Compañía: $compania\n\n";
$contenido .= "Mensaje:\n$mensaje\n\n";

if (!empty($productos)) {
  $contenido .= "Productos guardados en la solicitud:\n$productos\n\n";
}

$contenido .= "Este mensaje fue enviado desde el formulario del sitio web.";

$headers = "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "From: Quality Medical Service <no-reply@qualityms.com.mx>\r\n";

if (filter_var($correo, FILTER_VALIDATE_EMAIL)) {
  $headers .= "Reply-To: $correo\r\n";
}

$enviado = mail($para, $asunto, $contenido, $headers);
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Solicitud enviada | Quality Medical Service</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="style.css">
</head>

<body>
  <section class="contact-section">
    <div class="container">
      <div class="store-locked-card" style="margin: 80px auto;">
        <?php if ($enviado): ?>
          <h1>Solicitud enviada</h1>
          <p>Gracias por contactarnos. Recibimos tu solicitud de cotización y nos comunicaremos contigo por nuestros canales oficiales.</p>
          <a href="index.html" class="btn-primary">Volver al inicio</a>
        <?php else: ?>
          <h1>No se pudo enviar</h1>
          <p>Hubo un problema al enviar la solicitud. Por favor escríbenos directamente a contacto@qualityms.com.mx.</p>
          <a href="contacto.html" class="btn-primary">Volver al formulario</a>
        <?php endif; ?>
      </div>
    </div>
  </section>
</body>
</html>
