# Guía Rápida de Git y GitHub

Este archivo contiene los comandos esenciales para mantener tu proyecto actualizado.

## 📥 Traer cambios (De GitHub a Local)
Si hay cambios en el servidor que no tienes en tu computadora:

```bash
git pull
```

---

## 📤 Subir cambios (De Local a GitHub)
Sigue estos tres pasos en orden:

1. **Preparar los archivos:**
   ```bash
   git add .
   ```

2. **Crear el commit (el mensaje descriptivo):**
   ```bash
   git commit -m "Descripción de tus cambios"
   ```

3. **Enviar a la nube:**
   ```bash
   git push
   ```

---

## 🔍 Comandos de consulta
- `git status`: Revisa qué archivos has modificado y qué está listo para el commit.
- `git log --oneline`: Mira el historial reciente de cambios de forma resumida.
- `git branch`: Mira en qué rama estás trabajando (normalmente `main`).
