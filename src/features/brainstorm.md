¡Excelente idea! Volvamos a la mesa de diseño para consolidar todo lo aprendido en esta gran lluvia de ideas. Aquí tienes el mapa completo de mejoras, observaciones y optimizaciones técnicas estructuradas por pantallas, listas para que planifiques tu hoja de ruta de desarrollo:


## ⚙️ 1. Pantalla Principal y Modales de Carga

~~ Reorganizar Header ~~

_Estandarizar modelo de base de datos a usar._

~~ Modales Diferenciados (Peso vs. Unidad): Mantener la separación actual de vistas para productos pesados (kg) y por unidad. ~~

~~ Validación de Botón Decimal: Desactivar o poner en gris el punto (.) en el modal de unidades (ej. la piña) para evitar que el cajero intente marcar fracciones imposibles. ~~

~~ Cero Inicial Automático: Si el cajero presiona el punto (.) estando en cero en productos por peso, la app debe autocompletar a 0. para agilizar la carga de gramos (ej. .350 -> 0.350 kg). ~~

~~ Subtotal en Tiempo Real: Mostrar abajo del cuadro verde de cantidad el subtotal de la línea antes de agregarla al ticket (ej. 3 un x $3.50 = $10.50). ~~

~~ Límite de 3 Decimales en kg: Limitar la entrada del teclado numérico a 3 decimales para productos por peso y mostrar 3 decimales en badge, carrito y ticket. ~~

## 🛒 2. Pantalla "Mi Carrito" y "Ticket de Venta"

~~ Edición Rápida: Permitir que, al tocar la fila de un producto en el carrito, se abra de nuevo su teclado numérico para corregir los kilos o unidades de inmediato, sin tener que borrar el ítem con el ícono de la papelera.~~

~~ Homogeneización de Decimales: Unificar el uso de separadores en los totales (usar siempre la coma para decimales en Venezuela, ej. $3,50 y Bs 2.580,97).~~

## 💳 3. Gestión y Flujo de Cobranza

~~* Adaptación de Mercado (Pago Móvil): Reemplazar el botón de "QR / Yape" (sistema exclusivo de Perú) por el de "Pago Móvil", el método electrónico estándar en Venezuela.~~

~~_* Efectivo Multimoneda: Permitir que el botón "Efectivo" abra dos campos de texto independientes para registrar cuánto dinero entra en Dólares ($) y cuánto en Bolívares (Bs).~~

~~* Pagos Mixtos: Modificar el selector para que el cajero pueda abonar montos parciales combinando métodos (ej. paga $5 en efectivo y el resto por Pago Móvil) hasta saldar la cuenta.~~

~~* Módulo de Vuelto (Cambio): Diseñar la lógica para calcular de forma matemática el vuelto exacto del cliente en la moneda que el comerciante disponga.~~

_* Cálculo de IGTF (Opcional): Añadir un interruptor en configuración para calcular de forma automática el impuesto del 3% si el negocio es contribuyente especial._

_* Desglose Multimoneda por Ítem: Mostrar en cada línea del ticket impreso/digital el costo reflejado en ambas monedas de forma simultánea._

~~* Registro del Método de Pago: El ticket final debe plasmar obligatoriamente cómo pagó el cliente (efectivo, pago móvil, etc.) para el cuadre físico.~~

## 3.1 Atencion simultanea

## 3.2 Acceso al Historico de Ventas

* Desarrollar

## Unicidad de ramo al instalar

* Solo puede haber un ramo configurado. Si ya hay uno configurado y se trata de configurar otro debe haber un alert que los datos previos seran eliminados. Caso de insistir ya es responsabilidad del usuario y quedarà un log del user, fecha y hora y marcado como FATAL

## 🛡️ 4. Seguridad y Control de Acceso

~~* PIN de Administrador: Campo en Configuración (mín. 4, máx. 6 dígitos) con ojito mostrar/ocultar. ~~

~~* PinPrompt: Modal con teclado numérico estilo bloqueo que pide PIN al entrar a Configuración. ~~

~~* PIN hasheado: Se persiste en localStorage como SHA-256 (64 chars hex), nunca en texto plano. Compatibilidad hacia atrás con PINs legacy en texto plano. ~~

* Bloqueo por Sesión: Exigir este PIN al abrir el turno de trabajo por la mañana. El PIN bloquea automáticamente las funciones administrativas (Precios, Categorías, Tasa) al cerrar esas ventanas, evitando que el cajero las modifique si el dueño se retira del mostrador.

* Escudo de Fuerza Bruta: Bloquear temporalmente el teclado numérico durante 5 minutos si se introducen 3 PIN incorrectos de forma consecutiva y Notificar por email.



~~* Confirmación de Tasa Segura: Al cambiar la tasa del dólar, mostrar un modal de confirmación rápida (ej. ¿Confirmar nueva tasa a Bs 737,42?) para evitar errores tipográficos que alteren el valor de todo el inventario por accidente. ~~

## 📂 5. Gestión de Productos y Categorías

~~* Definicion de Ramos Comerciales en el cual va a ser utilizado el POS (CRUD implementado con nombre, identificador y flag activo/inactivo) ~~

~~* Ramo comercial alinear check y leyenda a la izquierda. ~~

~~* Categorías jerárquicas por Ramo Comercial: las categorías pertenecen a un ramo. Dropdown selector en gestión. ~~

~~* Productos con campo ramo: cada producto pertenece a un ramo. Dropdown RamoSelector reutilizable. ~~

~~* RamoSelector: componente único y reutilizable para seleccionar ramos en toda la app. ~~

* Expansión de Iconografía: Agregar íconos o emojis de proteínas (🥩, 🍗, 🐟, 🥓) y lácteos/quesos (🧀) para poder mudar el POS al ramo de carnicería y charcutería.

* Icono Comodín: Configurar la caja de cartón (📦) como imagen por defecto si el usuario olvida seleccionar un ícono al crear un producto general (víveres).

~~* Barra de Búsqueda: Añadir un buscador con filtro de texto en la parte superior de "Gestión de Productos" para agilizar la navegación cuando la lista supere los 100 ítems. ~~

~~* Ordenamiento Amigable: Sustituir el campo de texto numérico de Orden: 1 en las categorías por un sistema de arrastrar y soltar (Drag and Drop) o flechas simples (▲ / ▼).~~

## 📊 6. Administración y Analítica (Cierre de Caja)

* Desglose Financiero en Resumen: El resumen de ventas no solo debe mostrar los productos vendidos, sino totalizar el dinero clasificado por cada método de pago (Efectivo $, Efectivo Bs, Pago Móvil, Punto).

* Filtro de Fechas: Añadir un selector de calendario en el resumen diario para permitir auditorías de días anteriores, semanas o meses.

* Validación de Decimales y Ceros: Corregir errores de truncado en la interfaz que muestren ítems con 0 unidades pero con ingresos generados (ej. el caso de la lechuga).

## ⚡ 7. Arquitectura del Sistema (PWA Offline-First de 3 Cajeros)

* Privacidad Local y Resiliencia: Mantener la decisión de descartar la nube para resguardar la privacidad financiera y sobrevivir a la crisis eléctrica.

* Estrategia Híbrida de Almacenamiento (PouchDB + Dexie.js):

* Usar PouchDB únicamente como el canal de comunicación inalámbrico subterráneo para enviar las ventas en milisegundos a través del Wi-Fi de la tienda.

* Usar Dexie.js dentro de la app para indexar rápidamente esas ventas entrantes en tablas estructuradas, permitiendo que las consultas del "Resumen de Ventas" e informes estadísticos carguen al instante.

* Sincronización P2P o Servidor Local: Configurar un teléfono maestro (Móvil A) o una PC económica en la red Wi-Fi local que actúe como receptor central. Si la luz se va, los 3 móviles acumulan datos de forma aislada; al volver el Wi-Fi, sincronizan y consolidan todo de forma automática.

* Redundancia de Servidor (Failover): Crear un interruptor en la configuración de administración para poder apagar el rol de "Servidor" en el Móvil A y activarlo en el Móvil B si el administrador debe retirarse del local con su dispositivo.

------------------------------

## Identificacion de la app

Al instalar a la app se le asignarà un serial id que quedarà grabado en mi db para mi control.


## Proteccion de la APP

El cajero deja el telefono solo por un momento,
como activar una proteccion para acceso no autorizado?

