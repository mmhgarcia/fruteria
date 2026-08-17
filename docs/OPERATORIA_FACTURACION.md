# Operatoria de facturación — módulo Home

## Alcance y advertencia

Este documento describe el funcionamiento **actual** del flujo de venta de la pantalla Home de Frutería POS, a partir de la implementación de la aplicación.

La aplicación registra ventas localmente y genera un comprobante de venta. No se observan en este flujo integración con SENIAT, numeración fiscal, control fiscal, firma digital ni envío electrónico de facturas. Por ello, el ticket mostrado o impreso debe considerarse un comprobante interno, no una factura fiscal.

## Resumen del flujo

```text
Elegir ramo → buscar/filtrar producto → indicar cantidad o peso
→ revisar carrito → cobrar con uno o varios medios de pago
→ validar que el monto cubra el total → guardar venta localmente
→ vaciar carrito → mostrar/imprimir ticket → consultar tickets y reportes
```

## 1. Preparación antes de facturar

1. Abra la aplicación. Si es el primer uso, seleccione el **ramo comercial**. La elección carga los productos y categorías correspondientes; el ramo activo se conserva en la configuración local.
2. Verifique la **tasa** mostrada en la cabecera (`Tasa`). La pantalla calcula bolívares como `total USD × tasa`.
3. Si debe cambiarla, abra el menú lateral y entre en **Gestión de Tasas BCV**. Indique fecha y valor, confirme y pulse **Grabar**. La tasa recién guardada pasa a ser la tasa activa de la sesión.
4. Confirme que los productos y precios visibles sean los adecuados antes de agregar artículos. La tasa y los precios que se usen al cobrar quedan copiados dentro de la venta; un cambio posterior no recalcula una venta ya registrada.

## 2. Construcción del ticket

### Localizar el producto

1. Use el campo **Buscar producto...** para filtrar por nombre, o pulse una categoría en la barra de filtros.
2. Pulse la tarjeta del producto deseado. Cada tarjeta muestra el precio en USD y su equivalente en Bs a la tasa activa.

### Indicar cantidad o peso

1. En el teclado numérico ingrese la cantidad:
   - Para productos por **unidad**, solo admite números enteros.
   - Para productos por peso, admite hasta tres decimales.
2. Revise el importe previo, calculado como `cantidad/peso × precio USD` y convertido a bolívares con la tasa activa.
3. Pulse **Agregar al ticket**. Si el mismo producto ya existía, la aplicación suma la nueva cantidad a la anterior y recalcula el subtotal de esa línea.

### Revisar, modificar o anular líneas

1. Pulse el icono del carrito para abrir **Mi Carrito**.
2. Para modificar una línea, pulse su descripción e introduzca la nueva cantidad o peso; el subtotal se recalcula.
3. Para eliminar una línea, pulse el icono de papelera de esa línea.
4. Para anular todo el ticket, pulse **Cancelar** en el pie de Home y confirme la pregunta de vaciado. Esta acción borra el carrito, pero no una venta ya grabada.
5. Los totales muestran:
   - **Total $**: suma de los subtotales en USD.
   - **Total Bs**: total USD multiplicado por la tasa activa.
   - **Items**: número de líneas distintas, no la suma de unidades o kilos.

### Vista previa sin cobrar

1. Con al menos una línea, pulse **Ver Ticket**.
2. Puede revisar artículos, cantidades, tasa y totales, o usar **Imprimir**.
3. Esta vista no registra venta ni vacía el carrito. Su número de ticket es temporal/aleatorio cuando la venta aún no ha sido cobrada.

## 3. Cobro y confirmación de pago

1. Con un carrito no vacío, pulse **Cobrar**.
2. Revise la fecha, la tasa y el importe total en Bs. El modal permite pago mixto mediante estos campos:

   | Medio | Datos que se pueden registrar | Aporte al pago |
   | --- | --- | --- |
   | Pago Móvil | Referencia, banco y monto en Bs | Monto en Bs |
   | Punto de venta | Últimos 6 dígitos de tarjeta, banco y monto en Bs | Monto en Bs |
   | Divisa | Monto en USD | USD × tasa activa, en Bs |
   | Efectivo Bs | Monto en Bs | Monto en Bs |

3. Puede llenar uno o varios medios. El sistema calcula `total pagado` sumando Pago Móvil, Punto, Efectivo Bs y Divisa convertida a bolívares.
4. Observe el **Saldo Bs**:
   - Si es mayor que cero, falta dinero y **Grabar** permanece deshabilitado.
   - Si llega a cero, puede registrar el pago.
   - Si es menor que cero, el sistema muestra el excedente como **Vuelto** y permite grabar.
5. Pulse **Grabar**. No es posible confirmar un pago cuyo total sea cero.
6. Para abandonar el cobro sin registrar una venta, pulse **Cancelar** o toque fuera del modal. El carrito se conserva para continuar editándolo o cobrar después.

## 4. Qué ocurre al grabar

Al confirmar, Home construye una venta con:

- Fecha y hora ISO de la operación.
- Tasa usada, total USD y total Bs.
- Importes y datos de los cuatro medios de pago, total pagado y vuelto.
- Copia de cada línea: identificador, nombre, icono, unidad de medida, precio, ramo, cantidad y subtotal USD.

Después intenta guardar esa venta en el almacén `sales` de IndexedDB, dentro de la base local `fruteria-db`. A continuación la aplicación cierra el cobro, abre el comprobante y vacía el carrito.

## 5. Ticket posterior al cobro e impresión

Tras grabar se abre el ticket con el detalle de la venta, tasa, totales, métodos usados y vuelto. Desde allí:

1. Pulse **Cerrar** para volver a Home.
2. Pulse **Imprimir** para abrir una ventana del navegador y enviar el comprobante a la impresora disponible.

El ticket imprime el contenido visual del comprobante. No se almacena como PDF por esta acción. La fecha/hora que se muestran corresponden al momento en que se abre la previsualización; para consultar el registro de la operación se debe usar Tickets del Día.

## 6. Consulta posterior de ventas

Desde el menú lateral están disponibles estas consultas basadas en las ventas guardadas localmente:

1. **Tickets del Día**: carga las ventas entre las 00:00 y las 23:59:59 del día actual, muestra sus líneas, tasa, método predominante y totales. Puede ver o compartir un PDF de todos los tickets del día.
2. **Resumen de Ventas**: consulta por Hoy, Ayer, Semana, Mes o intervalo personalizado; calcula número de operaciones, ticket promedio, totales USD/Bs, desglose de cobros y productos vendidos. Permite ver, descargar o compartir un PDF.
3. **Productos más vendidos**: utiliza las mismas ventas locales para generar el ranking por producto.

## Reglas y consideraciones operativas

- El precio de cada producto se toma del catálogo al agregarlo al carrito. Cambiar un precio del catálogo no modifica las líneas que ya están en el carrito ni ventas anteriores.
- No se aprecia descuento, impuesto, IGTF, cliente, crédito, devolución, nota de crédito ni control de inventario automático en este flujo de Home. El resumen indica explícitamente `IGTF 3%: No aplicado`.
- La clasificación rápida de una venta en Tickets del Día muestra solo un medio: prioriza Divisa, después Pago Móvil, Punto y Efectivo Bs. En pagos mixtos se deben revisar los importes del registro o el ticket para ver el detalle completo.
- La información vive en el navegador/dispositivo (IndexedDB y localStorage). Borrar datos de la aplicación o cambiar de dispositivo puede impedir consultar las ventas; use los mecanismos de respaldo disponibles antes de realizar limpieza o reinstalación.
- Si falla el guardado en IndexedDB, el código actual solo registra el error en consola y aun así continúa a la vista de ticket y vacía el carrito. Ante cualquier aviso o duda de almacenamiento, confirme en **Tickets del Día** que la venta aparezca antes de entregar el comprobante como definitivo.
- El sistema permite sobrepago y calcula vuelto, pero no valida la referencia de Pago Móvil, el banco, la existencia de la tarjeta ni la autenticidad de los medios de pago. El cajero debe hacer esa validación fuera de la aplicación.

## Secuencia recomendada para el cajero

1. Validar ramo, catálogo y tasa.
2. Agregar cada producto con la cantidad/peso confirmado frente al cliente.
3. Abrir carrito, revisar líneas y total antes de cobrar.
4. Registrar los montos realmente recibidos por cada medio, incluido el USD cuando corresponda.
5. Comprobar saldo cero o el vuelto correcto y pulsar **Grabar**.
6. Verificar que se abra el ticket y, cuando sea necesario, imprimirlo.
7. Si se requiere control adicional, abrir **Tickets del Día** y confirmar que la operación figure allí.
