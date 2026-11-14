export type SitePhoto = { file: string; year: string; caption: { ro: string; en: string }; credit: string };

const PD = "Wikimedia Commons, public domain";
const FORTEPAN_PD = "Fortepan / Wikimedia Commons, public domain";
const URBAN = "Fortepan / Urbán Tamás, CC BY-SA 3.0";

// shortcut: bundled sites only, files in public/photos/<siteId>/; move to the site record when console-added places need photos.
const PHOTOS: Record<string, SitePhoto[]> = {
  mx: [
    { file: "1900-tram-a.jpg", year: "c. 1900", caption: { ro: "Tramvai electric de tip A", en: "A type A electric tram" }, credit: PD },
    { file: "1900-maria-stop.jpg", year: "c. 1900", caption: { ro: "Stația de tramvai din Piața Maria", en: "The tram stop in Piața Maria" }, credit: PD },
  ],
  unirii: [
    { file: "1905-square.jpg", year: "1905", caption: { ro: "Piața Unirii, pe atunci Losonczy tér", en: "Piața Unirii, then Losonczy tér" }, credit: "Fortepan / Bejczy Sándor, public domain" },
  ],
  victoriei: [
    { file: "1880-theatre.jpg", year: "1880", caption: { ro: "Teatrul Franz Joseph, azi Opera", en: "The Franz Joseph Theatre, today the Opera" }, credit: "József Kossak / Gallica, public domain" },
    { file: "1905-theatre.jpg", year: "c. 1905–1918", caption: { ro: "Teatrul, pe o carte poștală", en: "The theatre, on a postcard" }, credit: PD },
    { file: "1920-corso.jpg", year: "1920–1924", caption: { ro: "Corso, pe o carte poștală", en: "The Corso, on a postcard" }, credit: PD },
  ],
  bastion: [
    { file: "1906-fortress.jpg", year: "c. 1906", caption: { ro: "Zidurile cetății, cu bastioanele Eugen și Mercy", en: "The fortress walls, with the Eugen and Mercy bastions" }, credit: PD },
    { file: "1910-bega.jpg", year: "1910", caption: { ro: "Canalul Bega", en: "The Bega canal" }, credit: FORTEPAN_PD },
    { file: "1915-wall.jpg", year: "1915", caption: { ro: "Demolarea zidului cetății, la Poarta Transilvaniei", en: "The fortress wall being demolished, at the Transylvania Gate" }, credit: FORTEPAN_PD },
  ],
  cathedral: [
    { file: "1989-cathedral.jpg", year: "1989", caption: { ro: "Piața și Catedrala, decembrie 1989", en: "The square and the Cathedral, December 1989" }, credit: URBAN },
    { file: "1989-square.jpg", year: "1989", caption: { ro: "Soldați în piață, decembrie 1989", en: "Soldiers in the square, December 1989" }, credit: URBAN },
  ],
};

/** The site's historical photos (1 to 3), or none. */
export const photosFor = (siteId: string): SitePhoto[] => PHOTOS[siteId] ?? [];
