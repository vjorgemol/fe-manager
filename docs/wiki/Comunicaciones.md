# Comunicaciones Automáticas

Ahorra tiempo enviando correos personalizados con un solo clic. El sistema genera borradores automáticos para:
*   **Prospección**: Presentar el ciclo a nuevas empresas.
*   **Inicio de la FE**: Enviar los datos del alumno asignado a la empresa.
*   **Fin de la FE**: Recordar la entrega de documentación al finalizar la formación.

## Personalización de Plantillas
Puedes editar el texto de estos correos en **Ajustes > Plantillas de Email**. Las plantillas se guardan en la base de datos y persisten aunque reinicies la aplicación. 
El sistema permite usar variables entre llaves (ej: `{studentName}`, `{companyName}`) que se sustituirán por los datos reales al generar el correo.

### El uso de la variable `{hours}`
Esta variable es inteligente y se adapta según el contexto:
*   En **Prospección**: Muestra las horas totales definidas en Ajustes.
*   En **Inicio/Fin**: Muestra las horas específicas asignadas a ese alumno en su ficha de formación.
