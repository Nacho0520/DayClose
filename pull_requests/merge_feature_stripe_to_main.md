## ¿Qué incluye este PR?

Fusiona `feature/stripe` en `main` con todos los cambios de limpieza:

### Cambios principales
- ❌ Eliminado `@stripe/stripe-js` de `package.json`
- ❌ Eliminada la Edge Function `supabase/functions/lemonsqueezy-webhook/`
- ❌ Eliminado `src/components/ProWelcomeModal.jsx` (flujo Stripe/LemonSqueezy)
- 🔄 Renombradas todas las claves `localStorage` de `mivida_` → `dayclose_`
- 📧 Actualizado email VAPID: `admin@mivida.app` → `admin@dayclose.app`
- 📄 Documentación actualizada: "MiVida" → "DayClose"