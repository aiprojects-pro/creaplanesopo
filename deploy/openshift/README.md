# CreaPlanesOpo - OKD

Despliegue adaptado para OpenShift/OKD con build Docker desde GitHub.

## Recursos

- Namespace: `creaplanesopo`
- Secret: `creaplanesopo-config`
- PVCs: `creaplanesopo-outputs`, `creaplanesopo-backups`
- BuildConfig/ImageStream: `creaplanesopo`
- Deployment/Service/Route: `creaplanesopo`
- CronJob: `creaplanesopo-backup`

## Aplicacion

- Login: `/login.html`
- App: `/`
- Health: `/api/health`
- Descargas generadas: `/api/download/:name`

Los documentos se guardan en `/app/outputs` dentro del PVC `creaplanesopo-outputs`.
