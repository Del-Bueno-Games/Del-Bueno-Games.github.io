# Formularios de la web: guía de instalación (versión 2)

Esto es un pequeño programa que vive en la cuenta de Google del estudio. Recibe lo que la gente completa en los tres formularios de la web (contacto, novedades y trabajo), lo guarda en una planilla de Google y, en contacto y trabajo, manda el mensaje a la dirección de mail que elijas. No usa servicios ni cuentas nuevas.

## Qué necesitás

- Entrar con la cuenta de Google del estudio. Tiene que ser esa, porque los mails salen desde esa cuenta y la planilla se crea en su Drive.
- Saber a qué dirección de mail querés que lleguen los mensajes de contacto y a cuál las postulaciones de trabajo (pueden ser la misma).
- Unos 15 minutos.

## Paso a paso

1. Entrá a https://script.google.com con la cuenta del estudio. Si ya tenés el proyecto de la versión anterior, abrilo y seguí desde el paso 2. Si no, tocá «Nuevo proyecto» (New project) y ponele un nombre, por ejemplo "Formularios web".

2. Borrá todo lo que trae el editor, pegá el contenido completo del archivo `Code.gs` de esta carpeta y guardá (ícono del disquete o Ctrl+S).

3. Elegí las direcciones de mail. En el menú de la izquierda tocá la ruedita «Configuración del proyecto» (Project Settings). Bajá hasta «Propiedades de la secuencia de comandos» (Script Properties) y tocá «Agregar propiedad de secuencia de comandos» (Add script property). Agregá estas dos, una por una:
   - En «Propiedad» (Property) escribí `CONTACT_TO` y en «Valor» (Value) la dirección que recibe los mensajes de contacto.
   - En «Propiedad» (Property) escribí `CAREERS_TO` y en «Valor» (Value) la dirección que recibe las postulaciones de trabajo.

   Después tocá «Guardar las propiedades de las secuencias de comandos» (Save script properties). Si la versión anterior ya tenía `CONTACT_TO`, no hace falta tocarla.
   Más adelante van a aparecer solas otras propiedades: dos que empiezan con `RATE_` y una que se llama `SHEET_ID`. No las toques. Las `RATE_` cuentan los envíos para que nadie pueda agotar el límite diario de mails de la cuenta con un ataque (el límite es de 20 por hora entre los tres formularios juntos). `SHEET_ID` es la planilla donde se guardan los datos.

4. Creá la planilla y dale los permisos nuevos. Arriba, en el selector de funciones*, elegí `setup` y tocá «Ejecutar» (Run)*. Google te va a pedir permiso: tocá «Revisar permisos» (Review permissions)*, elegí la cuenta del estudio y permití. Pide enviar mails en tu nombre y manejar las planillas de Google de la cuenta, que es exactamente lo que hace el programa, y nada más.
   Si aparece una pantalla que dice que Google no verificó la aplicación, es porque el programa es tuyo y no viene de una tienda. Tocá «Configuración avanzada» (Advanced) y después «Ir a ...» (Go to ...).
   Cuando termine, abajo aparece el «Registro de ejecución» (Execution log)* con la dirección de la planilla "Website forms". Es la que tenés que abrir para leer lo que llega. Guardala en favoritos. Esto se hace una sola vez.

5. Publicalo.
   - Si es la primera vez: tocá «Implementar» (Deploy) y después «Nueva implementación» (New deployment). Tocá la ruedita que está junto a «Seleccionar tipo» (Select type) y elegí «Aplicación web» (Web app). En «Ejecutar como» (Execute as) poné «Yo» (Me). En «Quién tiene acceso» (Who has access) poné «Cualquier usuario» (Anyone). Tocá «Implementar» (Deploy).
   - Si ya estaba publicada la versión anterior: **no** hagas una implementación nueva. Mirá la sección de abajo, «Actualizar sin cambiar la dirección web».

6. Copiá la dirección web (URL) de la «Aplicación web» (Web app), que termina en `/exec`, con el botón «Copiar» (Copy).

7. Comprobá que anda: abrí esa dirección web en una ventana de incógnito. Tiene que decir "The website forms are running (v2)." Si dice "The contact form is running." sigue publicada la versión vieja: revisá que hayas hecho «Nueva versión» (New version) como se explica abajo.

## Actualizar sin cambiar la dirección web

Cada vez que cambie el código (incluida esta versión 2) hay que hacerlo así, siempre sobre la implementación que ya existe: «Implementar» (Deploy), «Administrar implementaciones» (Manage deployments), el lápiz de «Editar» (Edit), en «Versión» (Version) elegí «Nueva versión» (New version) y tocá «Implementar» (Deploy). Nunca uses «Nueva implementación» (New deployment) para actualizar: crea una dirección web nueva y las páginas seguirían usando la vieja. Guardar el código no alcanza: sin una nueva versión, la web sigue usando el código anterior.

## Si algo no sale

- Si no te aparece «Cualquier usuario» (Anyone), una configuración del administrador de la cuenta de Google del estudio lo bloquea. Quien administre la cuenta tiene que permitirlo.
- Si un formulario de la web responde con error de configuración, falta la propiedad de su mail: `CONTACT_TO` para contacto, `CAREERS_TO` para trabajo (el de novedades no necesita ninguna). Mientras falte, ese formulario no guarda nada ni manda mails.
- Si respondió "busy" o la web dice que no se pudo enviar y pasó poco tiempo desde muchos envíos, es el límite de 20 por hora. Se libera solo.

## La dirección que hay que copiar en la página

Es la dirección web (URL) de la «Aplicación web» (Web app) que termina en `/exec`, la del paso 6. Es la misma para los tres formularios, y no cambia si actualizás como se explica arriba. Pasásela a quien mantiene la web: tiene que ponerla en el `action` de los formularios de las páginas (`index.html` y `careers/index.html`).

* Esta etiqueta de pantalla no está confirmada en la documentación oficial de Google: puede aparecer con otro nombre o en otro lugar de la pantalla.
