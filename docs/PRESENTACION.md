# Presentación: Guía de Uso de FE Connect

A continuación tienes una presentación paso a paso que puedes navegar para conocer todas las posibilidades de la aplicación. 

````carousel
<div align="center">
  <h1>🎓 FE Connect</h1>
  <h3>Tu Gestor de Formación en Empresas</h3>
  <br/>
  <p>Bienvenido a la presentación interactiva. Desliza a la derecha para descubrir cómo dominar todas las funcionalidades de la aplicación y simplificar la gestión de tus alumnos y empresas colaboradoras.</p>
</div>

<!-- slide -->

## 1. ⚙️ Ajustes Iniciales (Lo primero es lo primero)

Antes de empezar a añadir alumnos o empresas, es recomendable configurar tu entorno.

> [!IMPORTANT]
> **Datos del Centro y Curso:** Ve a la pestaña **Ajustes** y asegúrate de que el "Curso Académico" (ej. 2023/2024), el nombre del centro y tus datos como tutor sean correctos. Esto se usará en los emails automáticos.

### Profesores
En esta misma pantalla puedes añadir a tus compañeros de departamento para luego asignarlos como responsables o tutores de seguimiento de los alumnos en prácticas.

<!-- slide -->

## 2. 📧 Plantillas de Email Inteligentes

FE Connect te ahorra horas redactando correos repetitivos.

En **Ajustes > Plantillas de Email**, puedes personalizar los textos que se enviarán en 3 escenarios clave:
1. **Prospección:** Para buscar nuevas empresas.
2. **Inicio de la FE:** Para presentar al alumno a la empresa.
3. **Fin de la FE:** Para recordar la documentación final.

**El poder de las variables:**
Puedes usar "comodines" en tus textos. Por ejemplo:
`Hola {contactPerson}, el alumno {studentName} comenzará sus {hours} horas...`
El sistema rellenará estos datos automáticamente para cada correo.

<!-- slide -->

## 3. 👩‍🎓 Gestión de Alumnos

La pestaña **Alumnos** es tu base de datos de estudiantes.

### Añadir Alumnos
- **Manualmente:** Haz clic en "Añadir Alumno". Puedes incluir su nombre, teléfono, email, notas e incluso **subir su foto** para reconocerlos más fácilmente.
- **Importación Masiva (CSV):** Si tienes un Excel o un listado de Aules, guárdalo como `.csv` y usa el botón **Importar CSV**. El sistema detectará los nombres y correos automáticamente, ¡y sin crear duplicados!

### Exportar
Con un clic, puedes descargar toda la lista de alumnos a Excel (CSV), pudiendo elegir si incluir las imágenes o no.

<!-- slide -->

## 4. 🏢 Directorio de Empresas

En **Empresas** gestionas tu red de colaboradores. Al igual que con los alumnos, puedes importarlas o exportarlas vía CSV.

> [!TIP]
> **Estados de Colaboración por Curso:** Cada año el estado de una empresa cambia. Al añadir/editar una empresa, puedes marcarla como:
> - **Sin contactar**
> - **Prospección enviada** (Se pinta de <span style="color:green">verde</span>)
> - **Colabora** (Se pinta de <span style="color:blue">azul</span>)
> - **No colabora** (Se pinta de <span style="color:gray">gris</span>)

**Mapas:** Si añades la dirección, la ficha de la empresa tendrá un enlace directo a Google Maps.
**Emails Inactivos:** Si un correo rebota, marca la casilla "Email Inactivo" para que el sistema te avise en rojo y no pierdas tiempo enviando correos ahí.

<!-- slide -->

## 5. 🤝 Asignación de Prácticas (El Núcleo)

Aquí es donde unes a un Alumno con una Empresa.

1. Haz clic en **Nueva Asignación**.
2. Selecciona un alumno (solo aparecerán los que aún no tienen prácticas).
3. Escribe para buscar una empresa.
4. Establece las **fechas** de inicio y fin, el **profesor responsable**, y el estado (Pendiente, En curso, etc.).

### Reportes
Desde aquí puedes generar un informe limpio para imprimir haciendo clic en el botón **Imprimir**, ideal para llevarlo a reuniones de departamento.

<!-- slide -->

## 6. 📄 Gestión de Anexos y Firmas

Dentro de la ficha de cada Asignación de Prácticas, tienes un panel dedicado a la "Documentación".

- **Subir PDFs:** Puedes subir directamente los archivos PDF de los **Anexos A1, A2 y A3**.
- **Avisos Automáticos:** Si el alumno no ha entregado el Anexo A3, haz clic en el icono gris del A3. El sistema generará un correo para el alumno recordándole que lo firme. *(Nota: Recuerda adjuntar el PDF manualmente en tu correo).*
- **Estado de Firma:** Marca la casilla inferior cuando **todos los anexos estén firmados** para llevar un control visual (el icono de firma se pondrá azul).

<!-- slide -->

## 7. 📊 Dashboard (Vista General)

Una vez que tengas datos introducidos, tu **Dashboard** cobrará vida.

En un solo vistazo podrás ver:
- El porcentaje de alumnos que ya tienen empresa asignada.
- El estado de la documentación general (cuántos faltan por firmar).
- La respuesta a tus correos de prospección.
- Gráficos visuales del progreso del curso.

> [!CAUTION]
> **Copias de Seguridad (Backup XML):** Como tus datos se guardan en tu navegador localmente de forma segura, recuerda ir periódicamente a **Ajustes** y descargar un Backup XML para no perder nunca tu información si cambias de ordenador.

````
