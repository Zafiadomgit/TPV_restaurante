# Quitar el aviso "Allow / Block" de QZ Tray (cajón y comandas)

QZ Tray es el programa que deja a la web abrir el cajón (caja) e imprimir las comandas
(cocina). Sin certificado trata la web como "anónima" y pregunta "Allow / Block" cada vez.
Con el certificado instalado reconoce la web como de confianza.

## 1. (Una vez) Variable secreta en Vercel — la hace quien administra Vercel
Vercel → proyecto **tpv-restaurante** → Settings → Environment Variables → Add:
- Key: `QZ_CLAVE_PRIVADA`
- Value: el contenido entero de la clave privada (de `-----BEGIN PRIVATE KEY-----` a
  `-----END PRIVATE KEY-----`, ambos incluidos)
- Environments: Production y Preview · marcar **Sensitive**
- Guardar y hacer **Redeploy** del último despliegue de producción.

La clave privada NO se guarda en el repositorio. El certificado público sí:
`client/public/qz/override.crt` (se descarga en `/qz/override.crt`).

## 2. (Una vez en cada ordenador: caja y cocina) Instalar el certificado en QZ Tray
1. Descargar el certificado: https://tpv-restaurante-nine.vercel.app/qz/override.crt
   (si el navegador lo abre como texto: clic derecho → "Guardar como…" → `override.crt`).
2. Copiar `override.crt` a la carpeta de QZ Tray: `C:\Program Files\QZ Tray\`
   (Windows pedirá permiso de administrador: "Continuar").
3. Cerrar QZ Tray (icono junto al reloj → clic derecho → Exit) y volver a abrirlo.
4. Recargar la página de caja/cocina con **Ctrl+F5** y pulsar "Abrir cajón" (o
   "Reimprimir" en cocina). Saldrá el aviso una última vez, ahora como sitio de confianza:
   marcar **"Remember this decision"** y pulsar **"Allow"**. Desde ahí ya no pregunta.

Si alguna vez se pulsó "Block" con "Remember this decision": QZ Tray (icono) → Advanced →
Site Manager → quitar la web de "Blocked".
