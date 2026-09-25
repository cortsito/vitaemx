type Policy = 'privacidad' | 'uso'

interface Props {
  page: Policy
}

export default function SitePolicies({ page }: Props) {
  const privacy = page === 'privacidad'

  return (
    <article className="policy" aria-labelledby="view-title">
      <header className="policy__intro">
        <p className="eyebrow">VitaeMX · actualizado en septiembre de 2026</p>
        <h1 className="view-title" id="view-title" tabIndex={-1}>
          {privacy ? 'Privacidad, sin letra pequeña.' : 'Condiciones de uso y límites.'}
        </h1>
        <p className="view-lede">
          {privacy
            ? 'VitaeMX está diseñado para explorar datos actuariales sin cuentas, formularios personales ni seguimiento publicitario.'
            : 'VitaeMX hace cálculos educativos sobre mortalidad poblacional. Sus resultados no son una cotización ni una recomendación profesional.'}
        </p>
      </header>

      <div className="policy__body">{privacy ? <PrivacyPolicy /> : <UsagePolicy />}</div>
    </article>
  )
}

function PrivacyPolicy() {
  return (
    <>
      <section className="policy-block" aria-labelledby="privacy-data-title">
        <p className="eyebrow">Datos</p>
        <h2 id="privacy-data-title">La aplicación no solicita datos personales.</h2>
        <p>
          No hay registro, inicio de sesión, formulario de contacto ni mecanismo para identificar a
          una persona. Las selecciones que haces —entidad, sexo, edad, producto, plazo, tasa y suma
          asegurada— se usan para calcular la respuesta de la sesión actual; VitaeMX no las guarda
          en una cuenta ni en el navegador.
        </p>
      </section>

      <section className="policy-block" aria-labelledby="privacy-cookies-title">
        <p className="eyebrow">Cookies y medición</p>
        <h2 id="privacy-cookies-title">No usamos cookies propias ni analítica.</h2>
        <p>
          VitaeMX no instala cookies propias, no usa localStorage o sessionStorage, y no incorpora
          píxeles publicitarios, analítica de producto, chat, mapas, videos o widgets de terceros.
          Por eso no hay banner de consentimiento de cookies que aceptar o rechazar dentro de la
          aplicación.
        </p>
      </section>

      <section className="policy-block" aria-labelledby="privacy-third-party-title">
        <p className="eyebrow">Servicios externos</p>
        <h2 id="privacy-third-party-title">Dos conexiones externas, con propósitos acotados.</h2>
        <p>
          La tipografía Montserrat se solicita a Google Fonts cuando cargas el sitio. Eso puede
          comunicar a Google datos técnicos de la conexión, como tu dirección IP, bajo sus propias
          políticas. Los enlaces al repositorio abren GitHub solo si decides seguirlos; VitaeMX no
          incrusta contenido de GitHub. El proveedor de alojamiento también puede conservar
          registros técnicos de servidor de acuerdo con su propia política.
        </p>
      </section>

      <section
        className="policy-block policy-block--notice"
        aria-labelledby="privacy-changes-title"
      >
        <p className="eyebrow">Cambios</p>
        <h2 id="privacy-changes-title">Esta página cambiará antes que el tratamiento de datos.</h2>
        <p>
          Si VitaeMX incorpora analítica, un formulario, cuentas, pagos o un proveedor adicional, se
          actualizará este aviso antes de activar ese cambio. Esta explicación describe el producto
          actual; no sustituye asesoría legal para operaciones que lleguen a tratar datos
          personales.
        </p>
      </section>
    </>
  )
}

function UsagePolicy() {
  return (
    <>
      <section className="policy-block" aria-labelledby="use-purpose-title">
        <p className="eyebrow">Propósito</p>
        <h2 id="use-purpose-title">Una herramienta para aprender y explorar.</h2>
        <p>
          VitaeMX reconstruye tablas de vida con proyecciones de CONAPO, ajusta una curva
          Gompertz-Makeham y calcula primas netas simplificadas. Está hecho para mostrar supuestos,
          fórmulas y limitaciones de forma verificable.
        </p>
      </section>

      <section className="policy-block" aria-labelledby="use-limit-title">
        <p className="eyebrow">Lo que no hace</p>
        <h2 id="use-limit-title">No es una cotización, diagnóstico ni consejo financiero.</h2>
        <p>
          Los resultados no sustituyen la suscripción de riesgo, la asesoría actuarial, financiera,
          médica o legal, ni una oferta de seguro. No consideran selección médica, gastos,
          rentabilidad, reservas, cancelaciones, ni circunstancias individuales.
        </p>
      </section>

      <section className="policy-block" aria-labelledby="use-sources-title">
        <p className="eyebrow">Fuentes y reproducibilidad</p>
        <h2 id="use-sources-title">La metodología y los datos son parte del resultado.</h2>
        <p>
          Consulta la metodología y las fuentes enlazadas desde la aplicación antes de usar una
          cifra fuera de su contexto. El código y los datos procesados viven en el repositorio
          público del proyecto; las fuentes originales y sus condiciones de uso se atribuyen ahí.
        </p>
      </section>
    </>
  )
}
