# Manual d'Ús - FE Connect (FCT Manager)

Benvingut a **FE Connect**! Aquesta eina ha sigut dissenyada per a facilitar la gestió integral de les Pràctiques en Empresa (FCT) dels teus alumnes, des del primer contacte amb les empreses fins al seguiment final.

---

## 🚀 Inici Ràpid: Primers Passos

> [!IMPORTANT]
> **Contrasenya per defecte**: En accedir per primera vegada, utilitza la contrasenya **`admin`**. Et recomanem canviar-la a la secció de **Ajustos > Seguretat** al més prompte possible.

1.  **Configura el Tutor**: Ves a **Ajustos** i emplena el teu nom, email i el nom del Cicle Formatiu. Això s'utilitzarà en tots els correus automàtics.
2.  **Configura les Hores**: A **Ajustos**, defineix les "Hores de la FE" (ex: 400). Aquest valor s'utilitzarà per defecte en els correus de prospecció.
3.  **Importa els teus Alumnes**: Si tens un llistat en format Aules o un CSV propi, importa'l des de la secció **Alumnes**.
4.  **Registra Empreses**: Afegeix les empreses col·laboradores a la secció **Empreses**.

---

## 👨‍🎓 Gestió d'Alumnes

En aquesta secció pots portar el control total dels teus estudiants.

### Importació de Dades
El sistema és compatible amb dos formats principals:
*   **Format Aules**: Exporta el llistat d'alumnes del teu curs en Aules (CSV) i importa'l directament.
*   **Format FE Connect**: Format complet que inclou telèfons i fotos.

> [!TIP]
> **Privacitat**: Totes les fotos s'emmagatzemen localment al teu ordinador mitjançant una base de dades professional (SQLite). Res es puja al núvol.

### Exportació
Pots exportar el llistat a CSV en qualsevol moment. En fer-ho, el sistema et preguntarà si vols incloure les imatges (útil per a còpies de seguretat ràpides en format Excel).

---

## 🏢 Directori d'Empreses

Porta un registre de qui accepta alumnes i qui no.

### Estats de Col·laboració
Per a cada curs acadèmic, pots marcar les empreses com a:
*   **Sense contactar**: Estat inicial.
*   **Prospecció**: Ja els has enviat el primer correu de contacte.
*   **Accepta**: Han confirmat que volen alumnes aquest curs.
*   **No accepta**: Han rebutjat la col·laboració aquest curs.

---

## 💼 Assignación de Pràctiques (Placements)

Ací és on connectes els alumnes amb les empreses. Aquesta secció et permet cercar, assignar i gestionar tota la documentació relacionada.

### Creació i Cerca
1.  Prem en **"Nova Assignació"**.
2.  Selecciona l'alumne i usa el cercador desplegable integrat per trobar ràpidament l'empresa.
3.  Indica les dates d'inici, fi, el total d'hores i el seu estat.
4.  Assigna un **Professor Responsable** per al seguiment.
*   **Cercador**: Pots usar la barra de cerca principal per localitzar ràpidament qualsevol pràctica pel nom de l'alumne, l'empresa o la seua localitat.

### Gestió de Documentació (Annexos)
Porta el control dels documents oficials (A1, A2, A3 i A5) directament des de la fitxa:
*   **Pujada de PDFs**: Adjunta els documents escanejats o signats digitalment.
*   **Lectura Automàtica (Annexos A3 i A5)**: En pujar aquests annexos, el sistema intenta processar-los automàticament:
    *   **Annex A3**: Llig el document i detecta de forma automàtica la persona que signa com a instructor/tutor de l'empresa. Extrau les seues dades (Nom, DNI i Email) i les compara amb la informació actual registrada per a eixa empresa. Si hi ha alguna diferència, el sistema et mostrarà una finestra de confirmació per actualitzar la fitxa de l'empresa amb les noves dades de l'instructor automàticament.
    *   **Annex A5**: Extrau el NIA de l'alumne per a canviar el nom de l'arxiu automàticament amb el format oficial (ex. `1234567_A51_2526.pdf`).
*   **Descàrrega**: Prem sobre la icona d'un document pujat per a descarregar-lo.
*   **Exportació Massiva**: Pots descarregar tota la documentació de les pràctiques en un únic arxiu ZIP mitjançant el botó corresponent. El ZIP contindrà una carpeta per a cada alumne (anomenada com `Cognom_Nom`) i dins d'ella tots els seus annexos (A1, A2, A3 i A5) adjuntats.
*   **Avís de Signatura (Annex A3)**: Si l'alumne encara no ha lliurat l'Annex A3, pots fer clic en el seu botó gris per generar automàticament un correu de recordatori sol·licitant la signatura. *(Important: L'arxiu PDF l'hauràs d'adjuntar tu manualment en el teu client de correu)*.
*   **Control Global**: Marca la casella "Signatura" per portar un registre ràpid de si tots els documents estan ja degudament signats.

---

## 📧 Comunicacions Automàtiques

Estalvia temps enviant correus personalitzats amb un sol clic. El sistema genera esborranys automàtics per a:
*   **Prospecció**: Presentar el cicle a noves empreses.
*   **Inici de la FE**: Enviar les dades de l'alumne assignat a l'empresa.
*   **Fi de la FE**: Recordar el lliurament de documentació en finalitzar les pràctiques.

### Personalització de Plantilles
Pots editar el text d'aquests correus a **Ajustos > Plantilles d'Email**. El sistema permet usar variables entre claus (ex: `{studentName}`, `{companyName}`) que se substituiran per les dades reals en generar el correu.

#### L'ús de la variable `{hours}`
Aquesta variable és intel·ligent i s'adapta segons el context:
*   A **Prospecció**: Mostra les hores totals definides a Ajustos.
*   A **Inici/Fi**: Mostra les hores específiques assignades a eixe alumne en la seua fitxa de pràctica.

---

## ⚙️ Ajustos i Còpies de Seguretat

### Backup XML (Molt Important)
Encara que les dades es guarden automàticament al teu equip, et recomanem descarregar un **Backup XML** periòdicament des d'Ajustos. Aquest arxiu conté **TOT** (alumnes amb les seues fotos, empreses, històric d'anys anteriors, les teues plantilles d'email personalitzades i la configuració d'hores) i et permet restaurar el sistema en un altre ordinador sense perdre res.

> [!WARNING]
> **Exclusió d'Annexos**: Per evitar arxius de còpia de seguretat extremadament pesats que saturen el sistema o bloquegen el navegador, el Backup XML **NO** inclou els documents PDF adjunts (annexos). Si desitges descarregar la documentació completa de les pràctiques, utilitza l'opció d'exportació massiva en ZIP des de la secció de Pràctiques.

### Gestió de Professors
Afegeix els teus companys de departament per poder assignar-los com a tutors de seguiment en les pràctiques.

---

## 🛠️ Notes Tècniques
*   **Base de dades**: Local (SQLite).
*   **Tecnologia**: React + Node.js.
*   **Seguretat**: Els correus no s'envien sols; el sistema obri el teu gestor de correu predeterminat (Outlook, Gmail, etc.) amb l'esborrany ja llest perquè tu el revises i l'envies.

---
## 📞 Suport i Contacte
Si tens algun dubte, trobes un error o tens suggeriments per a millorar l'aplicació, pots contactar amb el desenvolupador:

*   **Víctor Jorge Molina**
*   **Email**: [vicdejor@posteo.net](mailto:vicdejor@posteo.net)

---
*Manual generat per a FE Connect v1.5 - 2026 | Fet amb [Antigravity](https://antigravityai.io/)*
