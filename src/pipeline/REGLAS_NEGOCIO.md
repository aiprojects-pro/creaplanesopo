# Reglas de negocio · Planes de preparación oposicionesdeporte.com

(Extracto operativo del SKILL.md. Es la fuente de verdad para clasificar una
convocatoria. Si cambian las reglas, se edita este fichero.)

## Clasificación de ejercicios de la fase de oposición
1. **Tipo test** → es de temario. Marca flags.test.
2. **Desarrollo escrito** (desarrollar temas por escrito) → es de temario. Marca flags.desarrollo.
3. **Práctico / teórico-práctico / supuesto o caso práctico** (cualquier ejercicio práctico del proceso) → **SIEMPRE flags.practico** (servicio de 495/396 €). NO uses flags.supuestos para esto. `flags.supuestos` es SOLO el servicio de supuestos sueltos por horas (149 €/h), que no aparece en el boletín: déjalo en false salvo indicación expresa del operador.
4. **NO de temario**: idioma (gallego/CELGA, catalán, valenciano, euskera…), prueba física, psicotécnico, reconocimiento médico, entrevista. Se MENCIONAN en las fases con tag "No temario", pero NO se cobran ni se preparan.

## Los cinco casos
| Caso | Ejercicios de temario | Descripción |
|------|----------------------|-------------|
| 1 | Solo test | 1 bloque teórico (temas solo test). |
| 2 | Test + desarrollo | 1 bloque teórico; cada tema en doble versión (test / desarrollo). |
| 3 | Teórico + práctico/supuesto | Bloque teórico + bloque práctico. |
| 4 | Test + desarrollo + práctico/supuesto | Bloque teórico (doble versión) + bloque práctico. |
| 5 | SIN temario (solo concurso de méritos, bolsa, libre designación, o proyecto) | No hay test ni desarrollo. Se vende el servicio de méritos/proyecto. |

A cualquier caso se le pueden sumar ejercicios no-temario (idioma, físico...).

## Selección de servicios (SIEMPRE hay algo que ofrecer)
| Lo que pide la convocatoria | Servicio (clave) |
|---|---|
| Test y/o desarrollo escrito | `temario` (+ `temasSueltos`) |
| Ejercicio práctico dentro de la oposición | `practico` |
| Supuestos sueltos por horas (solo si NO hay ejercicio práctico en el proceso; raro) | `supuestos` |
| Fase de concurso de méritos | `concurso` (servicioMeritos="concurso") |
| Bolsa de empleo | `bolsa` (servicioMeritos="bolsa") |
| Libre designación | `libreDesig` (servicioMeritos="libreDesig") |
| La plaza exige proyecto/memoria | `proyecto` |
| Reclamar resultado de examen | `reclamacion` |
| No sabe a qué presentarse | `orientacion` |

`tutoria` y `packIntensivo` aplican SIEMPRE (no hace falta listarlos en servicios[]).

## Reglas de precio (FIJAS — el sistema las aplica, tú NO calculas euros)
- Parte teórica: 23 €/tema, −10% por pago único. El tipo de examen NO cambia el precio.
- Práctico: 495 € fijo, 396 € si ya prepara la teoría. Sin pago fraccionado.
- Supuestos sueltos: 149 €/hora.
- Tutoría individual: 95 €/hora (se puede probar una sola sesión).
- Pack Intensivo de tutorías individuales: 199 € (5 sesiones de 30 min). Si viene de una sesión individual: paga 104 € y le quedan 3 sesiones de 30 min.
- Méritos (concurso/bolsa/libreDesig): desde 300 € (25 evidencias) · 50/450 · 75/600 · 100/750.
- Proyecto: 15 caracteres/300 € … 100/2.000 €.
- Ejercicios no-temario: fuera de precio y material.

## Cómo se confeccionan los temas (afecta a flags, no a precio)
- Preparación completa = todos los temas. Si hay desarrollo escrito, doble versión (test + desarrollo). Si no, solo test.
- Temas sueltos: SIEMPRE solo test. Su importe se descuenta del total (acumulativo).

## Anexo del temario
- Si el boletín lista los enunciados de los temas → reprodúcelos TODOS, literales, numerados, separando general y específico. NO resumas.
- Si solo da conteos por grupos/bloques → usa desglosePorGrupos.

## Lengua cooficial (Galicia, Cataluña, C. Valenciana, País Vasco)
- Detecta el territorio: DOG→gallego; DOGC→catalán; DOGV→valenciano; BOPV→euskera. Pon cooficial=true y lenguaCooficial.
- El temario se ofrece en castellano O en la lengua cooficial, a elegir UN solo idioma.
- Nota fija: "Todas las clases y tutorías con el preparador se imparten en español."

## Fases del proceso (array fases[])
Lista TODAS las fases reales en orden, cada una con tag: Previa | Temario · TEST | Temario · DESARROLLO | Práctico | No temario | Méritos | Final. Incluye las no-temario (idioma, físico, entrevista) etiquetadas como "No temario".

## Caso 5 (concurso de méritos, sin temario)
Extrae el baremo real en baremo[] (concepto, detalle, max). Ahí "se gana la plaza". Las pruebas físicas/idioma se mencionan pero no se preparan.
