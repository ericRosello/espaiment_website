/* ==========================================================
   contenido.js – texts shared by the 3 design options (A, B, C)
   Edit contact data, topics and team bios HERE, once.
   Photos are read from ../images/ (same folder as the main site).
   Once a design is chosen, this content gets baked into plain HTML.
   ========================================================== */
const C = {
  tel: "698 953 728", telHref: "+34698953728",
  email: "espaiment.info@gmail.com",
  horario: "Lunes a viernes de 8:30h a 20:00h",
  direccion: "Carrer del Baró de Pinopar, 7A, 3°A, 07012 Palma, Illes Balears",
  instagram: "https://www.instagram.com/espaiment/",
  mapa: "https://www.google.com/maps?q=Carrer+del+Bar%C3%B3+de+Pinopar+7A,+07012+Palma&output=embed",
  temas: ["Trauma","Trastornos postraumáticos","Adicciones con y sin sustancia","Duelo","Ansiedad","Depresión","Estrés","Apego","Temas y conflictos familiares","Dificultades interpersonales","Dependencia emocional","Gestión emocional","Autoconocimiento","Crecimiento personal","Autoestima","Depresión, estrés o ansiedad laboral","Motivación laboral","Terapia de pareja","Bullying","Fobias","Miedos","Obsesiones y compulsiones","Culpa","Moving"],
  equipo: [
    { nombre: "Eva Franco", cargo: "Directora en EspaiMent", foto: "eva-franco.jpg", col: "B-03359",
      bio: ["Desde el primer momento supe que la psicología sería más que una profesión para mí; era una vocación que exigía responsabilidad y constancia. Esa pasión me ha llevado a dedicarme con el corazón al aprendizaje activo, formándome, investigando, leyendo y buscando siempre nuevas formas de ayudar a las personas.",
            "Mi objetivo es que te sientas acompañado y comprendido desde el primer día. Los procesos terapéuticos pueden ser desafiantes, pero recuerda: no tienes que recorrer este camino solo/a. Estoy aquí para caminar a tu lado.",
            "Si buscas un espacio seguro para trabajar tu bienestar emocional, no dudes en dar el primer paso."],
      formacion: ["Graduada en psicología con mención en intervención clínica en trastornos mentales y del comportamiento en la Universidad Nacional de Educación a Distancia.","Máster en Psicología General Sanitaria por el Centro Universitario Superior Europeo.","Máster en Trastornos Postraumáticos en la Universidad Nacional de Educación a Distancia.","Nivel I y II de EMDR por la Asociación española de EMDR."] },
    { nombre: "Marina Manzano", cargo: "", foto: "marina-manzano.jpg", col: "B-03434",
      bio: ["Soy Marina Manzano, psicóloga general sanitaria con una mirada integradora y centrada en la persona, porque creo que cada persona necesita un acompañamiento adaptado a su forma única de sentir, pensar y vivir.",
            "Utilizo un modelo integrador, lo que implica que elegiremos aquellas herramientas de terapias que han mostrado evidencias y se adaptan a cada caso en particular. Así pues, en base a esto acompaño a adultos y parejas a través de la terapia cognitivo-conductual, pero también de tercera generación y EMDR.",
            "Parto de la idea de que tú eres quién mejor se conoce, y mi papel es ayudarte para que puedas conectar contigo, con tus recursos y con tu propia capacidad de cambio. Juntos/as crearemos un espacio donde puedas sentirte seguro/a, escuchado/a y libre de juicios.",
            "Trabajo para que la terapia sea un lugar de encuentro contigo, donde puedas encontrarte, comprenderte y avanzar hacia una vida más coherente con quién eres y lo que necesitas."],
      formacion: ["Graduada en Psicología en la Universidad de les Illes Balears.","Máster en Psicología General Sanitaria en la Universidad de les Illes Balears.","Nivel I y II de EMDR por el Instituto Español de EMDR."] },
    { nombre: "Catalina Plomer", cargo: "", foto: "catalina-plomer.jpg", col: "B-02939",
      bio: ["Soy Catalina Plomer, psicóloga general sanitaria, y entiendo la psicología desde una mirada integrada: cada persona vive, siente y afronta la vida de forma única.",
            "Para mí, la terapia es un espacio donde poder comprender lo que nos ocurre y encontrar nuevas formas de relacionarnos con nosotros mismos y con los demás.",
            "Trabajo desde un enfoque cognitivo-conductual y EMDR, apostando siempre por una formación continua para ofrecer una atención rigurosa y adaptada a cada persona.",
            "A veces, ir a terapia es aprender herramientas. Otras, poner palabras a lo que sentimos. Y muchas veces… simplemente es tener un lugar seguro donde parar y escucharnos."],
      formacion: ["Graduada en Psicología en la Universidad de les Illes Balears.","Máster en Psicología General Sanitaria en la Universidad de la Rioja.","Nivel I y II de EMDR por el Instituto Español de EMDR."] },
    { nombre: "Victoire Caufriez", cargo: "", foto: "victoire-caufriez.jpg", col: "B-03768",
      bio: ["Soy Victoire Caufriez, psicóloga general sanitaria con enfoque cognitivo-conductual desde una mirada integrativa, y acompaño a niños/as, adolescentes y adultos en procesos relacionados con ansiedad, autoestima, relaciones, trauma y regulación emocional.",
            "Incorporo la perspectiva de género en el acompañamiento terapéutico, entendiendo cómo los vínculos, los roles y las experiencias sociales pueden influir en nuestra manera de relacionarnos con los demás y con nosotros/as mismos/as.",
            "A lo largo de mi recorrido profesional he trabajado especialmente en el acompañamiento a personas en situaciones de vulnerabilidad y violencia de género, tanto con mujeres como con infancia y adolescencia.",
            "Trabajo desde una mirada cercana, humana y adaptada a cada persona, integrando herramientas de diferentes enfoques psicológicos según las necesidades de quien acompaño.",
            "Realizo terapia tanto en castellano como en francés."],
      formacion: ["Grado en Psicología con mención en psicología clínica en la Universidad Complutense de Madrid.","Máster en Intervención psicológica en situaciones de crisis, emergencias y catástrofes en la Universidad Autónoma de Madrid.","Máster en Psicología General Sanitaria en la Universidad Internacional de Valencia.","Experto en intervención psicológica en violencia de género."] }
  ]
};

/* Fills every element marked with data-* attributes, clones the #persona
   template once per team member, and wires the mobile menu. */
function montar() {
  const all = (s, fn) => document.querySelectorAll(s).forEach(fn);
  all("[data-tel]", e => { e.textContent = C.tel; if (e.tagName === "A") e.href = "tel:" + C.telHref; });
  all("[data-wa]", e => e.href = "https://wa.me/" + C.telHref.replace("+", ""));
  all("[data-email]", e => { e.textContent = C.email; if (e.tagName === "A") e.href = "mailto:" + C.email; });
  all("[data-horario]", e => e.textContent = C.horario);
  all("[data-direccion]", e => e.textContent = C.direccion);
  all("[data-instagram]", e => e.href = C.instagram);
  all("[data-mapa]", e => e.src = C.mapa);
  all("[data-temas]", e => e.innerHTML = C.temas.map(t => `<li>${t}</li>`).join(""));

  const tpl = document.getElementById("persona"), lista = document.getElementById("equipo-lista");
  C.equipo.forEach(p => {
    const n = tpl.content.cloneNode(true), f = (s, fn) => { const e = n.querySelector(s); if (e) fn(e); };
    f("[data-nombre]", e => e.textContent = p.nombre);
    f("[data-cargo]", e => p.cargo ? e.textContent = p.cargo : e.remove());
    f("[data-col]", e => e.textContent = "Col. N.º " + p.col);
    f("[data-foto]", e => { e.src = "../images/" + p.foto; e.alt = p.nombre; e.loading = "lazy"; });
    f("[data-bio]", e => e.innerHTML = p.bio.map(t => `<p>${t}</p>`).join(""));
    f("[data-formacion]", e => e.innerHTML = p.formacion.map(t => `<li>${t}</li>`).join(""));
    lista.append(n);
  });

  const menu = document.querySelector("[data-menu]"), burger = document.querySelector("[data-burger]");
  burger.addEventListener("click", () => { const o = menu.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  menu.addEventListener("click", e => { if (e.target.tagName === "A") menu.classList.remove("open"); });
}
