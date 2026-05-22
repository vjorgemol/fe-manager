# Ajustes y Copias de Seguridad

## Backup XML (Muy Importante)
Aunque los datos se guardan automáticamente en tu equipo mediante un contenedor Docker (con volumen persistente), te recomendamos descargar un **Backup XML** periódicamente desde Ajustes. Este archivo contiene **TODO** (alumnos con sus fotos, empresas, histórico de años anteriores, tus plantillas de email personalizadas y la configuración de horas) y te permite restaurar el sistema en otro ordenador sin perder nada.

## Gestión de Profesores
Añade a tus compañeros de departamento para poder asignarlos como tutores de seguimiento en la formación.

## Notas Técnicas
*   **Base de datos**: Local (SQLite) persistente.
*   **Despliegue**: Preparado para funcionar mediante Docker y Docker Compose, facilitando su instalación en cualquier servidor o equipo.
*   **Seguridad**: Los correos no se envían solos; el sistema abre tu gestor de correo predeterminado (Outlook, Gmail, etc.) con el borrador ya listo para que tú lo revises y lo envíes.
*   **Desarrollo Local Seguro**: El entorno de desarrollo está configurado para servir la aplicación a través de HTTPS mediante certificados autofirmados, lo que permite exponerla de forma segura.
