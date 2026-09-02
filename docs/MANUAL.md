# Manual de Uso - FE Connect (FCT Manager)

¡Bienvenido a **FE Connect**! Esta herramienta ha sido diseñada para facilitar la gestión integral de las Prácticas en Empresa (FCT) de tus alumnos, desde la primera toma de contacto con las empresas hasta el seguimiento final.

---

## 🚀 Inicio Rápido: Primeros Pasos

> [!IMPORTANT]
> **Contraseña por defecto**: Al acceder por primera vez, utiliza la contraseña **`admin`**. Te recomendamos cambiarla en la sección de **Ajustes > Seguridad** lo antes posible.

1.  **Configura el Tutor**: Ve a **Ajustes** y rellena tu nombre, email y el nombre del Ciclo Formativo. Esto se usará en todos los correos automáticos.
2.  **Configura las Horas**: En **Ajustes**, define las "Horas de la FE" (ej: 400). Este valor se usará por defecto en los correos de prospección.
3.  **Importa tus Alumnos**: Si tienes un listado en formato Aules o un CSV propio, impórtalo desde la sección **Alumnos**.
4.  **Registra Empresas**: Añade las empresas colaboradoras en la sección **Empresas**.

---

## 👨‍🎓 Gestión de Alumnos

En esta sección puedes llevar el control total de tus estudiantes.

### Importación de Datos
El sistema es compatible con dos formatos principales:
*   **Formato Aules**: Exporta el listado de alumnos de tu curso en Aules (CSV) e impórtalo directamente.
*   **Formato FE Connect**: Formato completo que incluye teléfonos y fotos.

> [!TIP]
> **Privacidad**: Todas las fotos se almacenan localmente en tu ordenador mediante una base de datos profesional (SQLite). Nada se sube a la nube.

### Exportación
Puedes exportar el listado a CSV en cualquier momento. Al hacerlo, el sistema te preguntará si quieres incluir las imágenes (útil para copias de seguridad rápidas en formato Excel).

---

## 🏢 Directorio de Empresas

Lleva un registro de quién acepta alumnos y quién no.

### Estados de Colaboración
Para cada curso académico, puedes marcar a las empresas como:
*   **Sin contactar**: Estado inicial.
*   **Prospección**: Ya les has enviado el primer correo de contacto.
*   **Acepta**: Han confirmado que quieren alumnos este curso.
*   **No acepta**: Han rechazado la colaboración este curso.

---

## 💼 Asignación de Prácticas (Placements)

Aquí es donde conectas a los alumnos con las empresas. Esta sección te permite buscar, asignar y gestionar toda la documentación relacionada.

### Creación y Búsqueda
1.  Pulsa en **"Nueva Asignación"**.
2.  Selecciona al alumno y usa el buscador desplegable integrado para encontrar rápidamente a la empresa.
3.  Indica las fechas de inicio, fin, el total de horas y su estado.
4.  Asigna un **Profesor Responsable** para el seguimiento.
*   **Buscador**: Puedes usar la barra de búsqueda principal para localizar rápidamente cualquier práctica por el nombre del alumno, la empresa o su localidad.

### Gestión de Documentación (Anexos)
Lleva el control de los documentos oficiales (A1, A2, A3 y A5) directamente desde la ficha:
*   **Subida de PDFs**: Adjunta los documentos escaneados o firmados digitalmente.
*   **Lectura Automática (Anexos A3 y A5)**: Al subir estos anexos, el sistema intenta procesarlos automáticamente:
    *   **Anexo A3**: Lee el documento y detecta de forma automática la persona que firma como instructor/tutor de la empresa. Extrae sus datos (Nombre, DNI y Email) y los compara con la información actual registrada para esa empresa. Si hay alguna diferencia, el sistema te mostrará una ventana de confirmación para actualizar la ficha de la empresa con los nuevos datos del instructor automáticamente.
    *   **Anexo A5**: Extrae el NIA del alumno para renombrar el archivo automáticamente con el formato oficial (ej. `1234567_A51_2526.pdf`).
*   **Descarga**: Pulsa sobre el icono de un documento subido para descargarlo.
*   **Exportación Masiva**: Puedes descargar toda la documentación de las prácticas en un único archivo ZIP mediante el botón correspondiente. El ZIP contendrá una carpeta para cada alumno (nombrada como `Apellido_Nombre`) y dentro de ella todos sus anexos (A1, A2, A3 y A5) adjuntados.
*   **Aviso de Firma (Anexo A3)**: Si el alumno aún no ha entregado el Anexo A3, puedes hacer clic en su botón gris para generar automáticamente un correo de recordatorio solicitando la firma. *(Importante: El archivo PDF deberás adjuntarlo tú manualmente en tu cliente de correo)*.
*   **Control Global**: Marca la casilla "Firma" para llevar un registro rápido de si todos los documentos están ya debidamente firmados.

---

## 📧 Comunicaciones Automáticas

Ahorra tiempo enviando correos personalizados con un solo clic. El sistema genera borradores automáticos para:
*   **Prospección**: Presentar el ciclo a nuevas empresas.
*   **Inicio de la FE**: Enviar los datos del alumno asignado a la empresa.
*   **Fin de la FE**: Recordar la entrega de documentación al finalizar las prácticas.

### Personalización de Plantillas
Puedes editar el texto de estos correos en **Ajustes > Plantillas de Email**. El sistema permite usar variables entre llaves (ej: `{studentName}`, `{companyName}`) que se sustituirán por los datos reales al generar el correo.

#### El uso de la variable `{hours}`
Esta variable es inteligente y se adapta según el contexto:
*   En **Prospección**: Muestra las horas totales definidas en Ajustes.
*   En **Inicio/Fin**: Muestra las horas específicas asignadas a ese alumno en su ficha de práctica.

---

## ⚙️ Ajustes y Copias de Seguridad

### Backup XML (Muy Importante)
Aunque los datos se guardan automáticamente en tu equipo, te recomendamos descargar un **Backup XML** periódicamente desde Ajustes. Este archivo contiene **TODO** (alumnos con sus fotos, empresas, histórico de años anteriores, tus plantillas de email personalizadas y la configuración de horas) y te permite restaurar el sistema en otro ordenador sin perder nada.

> [!WARNING]
> **Exclusión de Anexos**: Para evitar archivos de copia de seguridad extremadamente pesados que saturen el sistema o bloqueen el navegador, el Backup XML **NO** incluye los documentos PDF adjuntos (anexos). Si deseas descargar la documentación completa de las prácticas, utiliza la opción de exportación masiva en ZIP desde la sección de Prácticas.

### Gestión de Profesores
Añade a tus compañeros de departamento para poder asignarlos como tutores de seguimiento en las prácticas.

---

## 🛠️ Notas Técnicas
*   **Base de datos**: Local (SQLite).
*   **Tecnología**: React + Node.js.
*   **Seguridad**: Los correos no se envían solos; el sistema abre tu gestor de correo predeterminado (Outlook, Gmail, etc.) con el borrador ya listo para que tú lo revises y lo envíes.

---
## 📞 Soporte y Contacto
Si tienes alguna duda, encuentras un error o tienes sugerencias para mejorar la aplicación, puedes contactar con el desarrollador:

*   **Víctor Jorge Molina**
*   **Email**: [vicdejor@posteo.net](mailto:vicdejor@posteo.net)

---
*Manual generado para FE Connect v1.5 - 2026 | Hecho con [Antigravity](https://antigravityai.io/)*
