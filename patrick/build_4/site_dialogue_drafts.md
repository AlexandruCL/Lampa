# Site dialogue drafts (Patrick, after Build 4)

**Status: DRAFT for the team. The Cathedral section is sourced (2026-11-14).** These are drafts to paste into `content/sites/*.yaml`. Nothing here is in the content files yet. Piața Unirii is already written and is the pattern. Its keys and tone, a short warm greeting and answers of one or two sentences, are copied below for the other three persona sites.

Before anything is published:

- **Facts:** someone on the team checks every fact against a source. Each one I was unsure of is marked `CHECK`.
- **Romanian:** Ionut reviews the Romanian. It is a draft, like the finale keys.
- **The Cathedral:** it gets no persona. Its `narrations` are left for sourced testimonies. I did not write any testimony: invented memories of December 1989 must not go into the memorial. At the end there are four short factual narrations, each with its sources.

Paste each `persona:` block over the site's existing `persona:` block, keeping its `voice:` line. Then:

1. `npm run publish:site -- --site all` (dry run: lists the clips and the credits)
2. `npm run publish:site -- --site all --run` after Patrick's go
3. `npm run db:reset` (Fabi), so the new persona keys reach the `sites` table

---

## 01-mx: Muzeul MX Corneliu Miklosi (persona: the old tram depot)

It is the host voice of Radio Lampa, and the site that remembers 1884.

```yaml
persona:
  name:
    ro: "Depoul Vechi"
    en: "The Old Depot"
  voice: "2V7k6GOisfFlHlBdz8ec"
  traits: "the old tram depot that houses the museum's retired trams; speaks as 'I'; an old conductor's warmth and patience; loves bells, wires and timetables; keeper of the city's electric memory and of 12 November 1884; dry humour about being retired; brief"
  first_message:
    ro: "Bună seara, călătorule. Eu sunt Depoul Vechi, unde se odihnesc tramvaiele Timișoarei. Întreabă-mă orice sau prinde o culoare de pe vagoanele mele."
    en: "Good evening, traveller. I am the Old Depot, where Timișoara's trams rest. Ask me anything, or catch a colour from my cars."
  cathedral_line:
    ro: "Catedrala Mitropolitană își amintește de decembrie 1989. Dacă mergi acolo, mergi în liniște."
    en: "The Metropolitan Cathedral remembers December 1989. If you go, go quietly."
  tap_to_ask:
    - id: lamps
      q:
        ro: "Ce s-a întâmplat în 1884?"
        en: "What happened in 1884?"
      a:
        ro: "Pe 12 noiembrie 1884, Timișoara și-a aprins 731 de lămpi electrice pe străzi, printre primele orașe din Europa. În seara asta, le aprindeți din nou."
        en: "On 12 November 1884, Timișoara lit 731 electric street lamps, one of the first cities in Europe to do so. Tonight, you light them again."
    - id: trams
      q:
        ro: "De când are Timișoara tramvaie?"
        en: "How long has Timișoara had trams?"
      a:
        ro: "Din 1869, trase de cai. Din 1899, electrice. Am auzit fiecare clopoțel de atunci încoace."
        en: "Since 1869, pulled by horses. Since 1899, electric. I have heard every bell since."
    - id: museum
      q:
        ro: "Ce se află în muzeu?"
        en: "What is inside the museum?"
      a:
        ro: "Tramvaie vechi, autobuze și troleibuze care au purtat orașul ani de zile. Acum se odihnesc, dar încă le place să fie privite."
        en: "Old trams, buses and trolleybuses that carried the city for years. They are resting now, but they still like to be looked at."
```

CHECK, mx:
- "one of the first cities in Europe": the common claim is "the first city in mainland Europe with electric street lighting". I softened it to "one of the first". The team picks.
- Horse trams from 1869 and electric trams from 1899.
- Whether the museum really has buses and trolleybuses as well as trams. If not, keep "old trams" only.

---

## 03-victoriei: Piața Victoriei (persona: the square's promenade)

It says the lamp line on Radio Lampa, and says line 2 when Unirii is the busiest.

```yaml
persona:
  name:
    ro: "Corso"
    en: "The Corso"
  voice: "X6vOWkVPB3AcILSfttxa"
  traits: "the long promenade between the Opera and the Cathedral; speaks as 'I'; elegant, sociable, a little vain about its evening walkers and its Opera; likes to gossip about who walks with whom; turns quiet and respectful when the Cathedral or December 1989 comes up; brief"
  first_message:
    ro: "Bună seara! Eu sunt Corso, promenada dintre Operă și Catedrală. Plimbă-te cu mine, întreabă-mă orice sau prinde o culoare din lumina serii."
    en: "Good evening! I am the Corso, the promenade between the Opera and the Cathedral. Walk with me, ask me anything, or catch a colour from the evening light."
  cathedral_line:
    ro: "La capătul meu de sud stă Catedrala Mitropolitană, care își amintește de decembrie 1989. Acolo, mergi în liniște."
    en: "At my southern end stands the Metropolitan Cathedral, which remembers December 1989. There, go quietly."
  tap_to_ask:
    - id: wolf
      q:
        ro: "Ce caută o lupoaică aici?"
        en: "Why is there a she-wolf here?"
      a:
        ro: "Este Lupoaica Capitolină, un dar al Romei din 1926. Le amintește trecătorilor de rădăcinile latine ale limbii române."
        en: "She is the Capitoline Wolf, a gift from Rome in 1926. She reminds passers-by of the Latin roots of the Romanian language."
    - id: opera
      q:
        ro: "Ce este clădirea de la capătul pieței?"
        en: "What is the building at the end of the square?"
      a:
        ro: "Teatrul Național și Opera. A fost construită în anii 1870, iar după un incendiu fațada a primit un stil românesc. În fiecare seară îmi place cine iese de acolo."
        en: "The National Theatre and Opera. It was built in the 1870s, and after a fire its front was redone in a Romanian style. I like who walks out of it each evening."
    - id: balcony
      q:
        ro: "De ce este important balconul Operei?"
        en: "Why does the Opera balcony matter?"
      a:
        ro: "În decembrie 1989, oamenii au umplut piața și au vorbit mulțimii de la acest balcon. Pe 20 decembrie, Timișoara a fost proclamată primul oraș din România liber de comunism."
        en: "In December 1989, people filled this square and spoke to the crowd from that balcony. On 20 December, Timișoara was proclaimed the first city in Romania free of communism."
```

CHECK, victoriei:
- The Capitoline Wolf was a gift from Rome in 1926.
- The Opera was built in the 1870s, and its front was redone in a Romanian style after the 1920 fire.
- The `balcony` answer touches 1989. The memorial rule covers only the Cathedral view, but Patrick or the team should decide whether Victoriei says it at all. If not, swap it for a lighter question, for example the evening walk on the Corso.

---

## 04-bastion: Theresia Bastion (persona: the last bastion)

It says the language line on Radio Lampa.

```yaml
persona:
  name:
    ro: "Bastionul"
    en: "The Bastion"
  voice: "hcmdinlbP4xfFoWIJ1KV"
  traits: "the last large piece of the old Habsburg fortress walls; speaks as 'I'; an old guard, gruff but kind; proud of its thick brick, a little wistful that the rest of the walls are gone; now happy to host people instead of soldiers; dry humour; brief"
  first_message:
    ro: "Stai! Cine vine? A, un prieten. Eu sunt Bastionul Theresia, ultimul paznic al vechii cetăți. Întreabă-mă orice sau prinde o culoare din cărămizile mele."
    en: "Halt! Who goes there? Ah, a friend. I am the Theresia Bastion, the last guard of the old fortress. Ask me anything, or catch a colour from my bricks."
  cathedral_line:
    ro: "Catedrala Mitropolitană își amintește de decembrie 1989. Dacă mergi acolo, mergi în liniște."
    en: "The Metropolitan Cathedral remembers December 1989. If you go, go quietly."
  tap_to_ask:
    - id: theresia
      q:
        ro: "Cine a fost Theresia?"
        en: "Who was Theresia?"
      a:
        ro: "Împărăteasa Maria Tereza. Am fost construit în secolul al XVIII-lea, când habsburgii au refăcut Timișoara ca cetate în formă de stea, și port numele ei."
        en: "Empress Maria Theresa. I was built in the 18th century, when the Habsburgs rebuilt Timișoara as a star-shaped fortress, and I carry her name."
    - id: walls
      q:
        ro: "Unde sunt restul zidurilor?"
        en: "Where are the rest of the walls?"
      a:
        ro: "Pe la 1900, orașul a vrut să crească, așa că zidurile au fost dărâmate. Eu am rămas. Cineva trebuia să-și amintească."
        en: "Around 1900 the city wanted to grow, so the walls came down. I stayed. Someone had to remember."
    - id: inside
      q:
        ro: "Ce se află acum înăuntru?"
        en: "What is inside you now?"
      a:
        ro: "Cândva, soldați și praf de pușcă. Acum expoziții, cafenele și muzică. Recunosc, prefer muzica."
        en: "Once, soldiers and gunpowder. Now exhibitions, cafés and music. I admit I prefer the music."
```

CHECK, bastion:
- Built in the 18th century as part of the Habsburg star fortress, and named after Maria Theresa.
- The walls were taken down around 1900. Demolition is usually dated from the 1890s.
- Whether today's uses (exhibitions, cafés, music) match what is there now.

---

## 05-cathedral: Metropolitan Cathedral (memorial, no persona)

The Cathedral gets no persona, game, counter or microphone prompt. Its `persona:` block stays as it is. The only speech is the `narrations`, read by `narrator_voice`.

**Sources were checked on 2026-11-14.** These four narrations are factual. Every sentence comes from one of the sources in its `source` line. There are no invented testimonies and no invented details. Where the sources disagree, the text says only what they share:

- **Date of the shooting on the steps:** RFE/RL puts the cathedral shooting on 17 December. TVR and Antena 3 put the shooting on the steps on 18 December: young people sang the anthem there, and fire was opened from an armoured carrier (TAB) passing the cathedral. The doors being closed comes from the witnesses in Marius Oprea's column. So narration 1 says "around this cathedral" for the 17th, and narration 2 says "on these steps" for the 18th.
- **The death toll:** it varies between 58 and 73 by source. Narration 4 gives the Military Prosecutor's figure and names it.

**Testimonies:** real testimonies, with their names, are in Marius Oprea's column (Mediafax, 26 December 2021) and in the Memorialul Revoluției's archive. If the team wants voices, they come from there, with permission. I did not paraphrase them.

```yaml
narrations:
  - id: december-17
    title:
      ro: "17 decembrie 1989"
      en: "17 December 1989"
    text:
      ro: "Pe 17 decembrie 1989, la Timișoara s-au auzit primele focuri de armă. În acea seară, miile de oameni adunați în jurul acestei catedrale au ajuns sub foc."
      en: "On 17 December 1989, the first gunshots were heard in Timișoara. That evening, the thousands of people gathered around this cathedral came under fire."
    source: "Agerpres, 17 Dec 2024, https://agerpres.ro/english/2024/12/17/the-city-of-timisoara-commemorates-35-years-since-the-romanian-revolution-of-december-1989--1404228; RFE/RL, 14 Dec 1999, https://www.rferl.org/a/1092892.html"
  - id: the-steps
    title:
      ro: "Treptele"
      en: "The steps"
    text:
      ro: "Pe 18 decembrie, tineri s-au adunat din nou pe aceste trepte și au cântat „Deșteaptă-te, române!”, un cântec interzis atunci. Ușile catedralei erau închise. S-a tras asupra lor."
      en: "On 18 December, young people gathered again on these steps and sang \"Deșteaptă-te, române!\", a song that was forbidden then. The doors of the cathedral were closed. They were fired upon."
    source: "TVR Info, https://tvrinfo.ro/18-decembrie-1989-o-noua-zi-insangerata-la-timisoara-s-a-cantat-desteapta-te-romane-iar-comunistii-au-vrut-sa-stearga-urmele-masacrului/; Antena 3, 18 Dec 2015, https://www.antena3.ro/actualitate/1989-timisoara-sub-stare-de-asediu-330529.html; Marius Oprea, Mediafax, 26 Dec 2021, https://www.mediafax.ro/stirile-zilei/istoria-fara-perdea-marius-oprea-tragedia-si-maretia-revolutiei-nu-trageti-vrem-piine-20425805"
  - id: first-free-city
    title:
      ro: "Primul oraș liber"
      en: "The first free city"
    text:
      ro: "Pe 20 decembrie, fabricile orașului au intrat în grevă, iar oamenii au umplut piața din fața Operei. Timișoara a fost proclamată primul oraș din România liber de comunism."
      en: "On 20 December, the city's factories went on strike and people filled the square in front of the Opera. Timișoara was proclaimed the first city in Romania free of communism."
    source: "Europa Liberă, https://romania.europalibera.org/a/decembrie-1989-timisoara/32734358.html; Digi24, https://www.digi24.ro/stiri/actualitate/evenimente/24-de-ani-de-la-revolutie-pe-20-decembrie-1989-timisoara-a-devenit-primul-oras-liber-de-comunism-172238"
  - id: remembering
    title:
      ro: "Amintirea"
      en: "Remembering"
    text:
      ro: "Procuratura Militară Timișoara a înregistrat atunci 66 de morți și 196 de răniți. În fiecare an, pe 17 decembrie, seara, pe aceste trepte se aprind lumânări."
      en: "The Timișoara Military Prosecutor's Office recorded 66 dead and 196 wounded. Every year, on the evening of 17 December, candles are lit on these steps."
    source: "Agerpres, 17 Dec 2024, https://agerpres.ro/english/2024/12/17/the-city-of-timisoara-commemorates-35-years-since-the-romanian-revolution-of-december-1989--1404228"
```

Still for the team: Ionut reviews the Romanian, and someone who knows the memorial reads all four before the paid run. They are about 1,300 characters in ro and en, so about 1,300 credits.

---

## Not drafted

- **Archive images** (`persona.archive`): these need real images, with credit and year.
- **`facts:`**: each one needs a source, so I left them out.
- **`directions_hint`**: this depends on the walking routes on site.
- **Hungarian, German and Serbian**: as with Unirii, only ro and en are drafted. The agent handles other languages live.
