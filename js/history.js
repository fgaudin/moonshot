/* History capsules: public-domain NASA photographs with a short story tied to each module's physics.
   Images live in img/history/ (1280 px WebP). Each capsule credits NASA, the photo number and the date,
   and links to the original on images.nasa.gov. Titles, stories and alt texts are translated with T. */
(function () {
  'use strict';

  const CAPSULES = {
    blueMarble: {
      img: 'as17-148-22727', date: '1972-12-07', mission: 'Apollo 17',
      title: N`The ball everything falls around`,
      alt: N`The whole Earth, fully lit, from Africa to the Antarctic ice cap`,
      story: N`Apollo 17’s crew took this photograph on the way to the Moon, about 29 000 km out. The Sun was behind the spacecraft, so the whole disc is lit, from the Mediterranean to the Antarctic ice cap. Every trajectory in this manual is a fall around that ball: 6 378 km of radius and μ = 3.986 × 10¹⁴ m³/s².`,
    },
    fullMoon: {
      img: 'as11-44-6667', date: '1969-07-21', mission: 'Apollo 11',
      title: N`The full Moon, on the way home`,
      alt: N`The full Moon against black space, every mare and crater sharp`,
      story: N`Photographed by the Apollo 11 crew on their way home, about 18 500 km from the Moon, a day after Armstrong and Aldrin left its surface.`,
    },
    apollo13mcc: {
      img: 's70-35139', id: 'S70-35139', date: '1970-04-13', mission: 'Apollo 13',
      title: N`Every burn was a PAD`,
      alt: N`Mission Control in Houston: rows of consoles, a world map with ground tracks, and an astronaut on the big screen`,
      story: N`Mission Control during Apollo 13’s fourth TV broadcast. Flight director Gene Kranz, back to the camera, watches Fred Haise on the big screen. Minutes later an oxygen tank exploded. Over the next four days the ground computed every burn the crew needed and read each one up as a PAD: a 30-second descent-engine burn back onto a free return, then a burn of about four and a half minutes two hours after passing the Moon to speed up the return. For a later 14-second correction, with the computer powered down to save electricity, the crew aimed the spacecraft by keeping Earth’s day–night line on a mark in the window and timed the burn by hand.`,
    },
    trench: {
      img: 's69-39593', id: 'S69-39593', date: '1969-07-20', mission: 'Apollo 11',
      title: N`The Trench`,
      alt: N`Mission Control in Houston: rows of consoles facing large projection screens`,
      story: N`Mission Control during the Apollo 11 moonwalk. The front row, nicknamed the Trench, belonged to the flight dynamics officer (FIDO), the guidance officer and the retrofire officer. Their job was the content of this module: from radar and Doppler tracking they determined the spacecraft’s orbit, predicted where it would be, and computed the next burns on IBM System/360 computers one floor below.`,
    },
    f1: {
      img: '9903405', focus: '50% 85%', date: '1964', mission: 'Saturn V',
      title: N`One of five`,
      alt: N`An F-1 rocket engine on a transport stand, several times taller than the technician beside it`,
      story: N`An F-1 engine dwarfs a technician. Each one burned about 2.6 tonnes of kerosene and liquid oxygen per second (the ṁ of the thrust equation) to produce 6.77 MN at sea level, and the S-IC carried five. The F-1 remains the most powerful single-chamber liquid-fuelled rocket engine ever flown.`,
    },
    sic: {
      img: '6869295', date: '1968-08', mission: 'Saturn V',
      title: N`A first stage travels by water`,
      alt: N`A Saturn V first stage lying on a barge on a river`,
      story: N`A Saturn V first stage on the barge Pearl River, returning from test firing at the Mississippi Test Facility to the Michoud Assembly Facility in New Orleans. At 10 m across and 42 m long, it could not travel by road or rail. Empty, it weighed about 130 t; fuelled, more than 2 200 t. That is a mass ratio near 17 for the stage alone, before anything is stacked on top.`,
    },
    liftoff: {
      img: 's69-39959', id: 'S69-39959', focus: '50% 4%', date: '1969-07-16', mission: 'Apollo 11',
      title: N`Thrust-to-weight 1.18`,
      alt: N`The Saturn V rising past the launch tower in fire and smoke, seen from above`,
      story: N`Apollo 11 rises past the launch tower, photographed by a camera mounted on the tower itself. With a thrust-to-weight ratio of only 1.18, the 2 900-tonne vehicle accelerated at under 2 m/s² and needed about 12 seconds to clear the tower. Notice how vertical it still is: the roll and pitch program only began once the tower was cleared.`,
    },
    gemini: {
      img: 's65-63898', date: '1965-12-15', mission: 'Gemini 6A / 7',
      title: N`The first rendezvous`,
      alt: N`The Gemini 6 capsule against black space, seen from about twelve metres`,
      story: N`Gemini 6A, photographed from Gemini 7 about 12 m away. Gemini 6A launched eleven days after Gemini 7 and caught up with it using the manoeuvres of this module: phasing in a lower, faster orbit, then a transfer timed by the lead angle. Wally Schirra and Tom Stafford then flew in formation with Frank Borman and Jim Lovell for more than five hours, at times only 30 cm apart.`,
    },
    dockingSystem: {
      img: 's68-50869', id: 'S68-50869', focus: '50% 40%', date: '1968', mission: 'Apollo',
      title: N`Probe meets drogue`,
      alt: N`Engineering set-up of the Apollo docking system: a cone-shaped drogue above the probe mechanism`,
      story: N`An engineering set-up of the Apollo docking system: the command module’s probe entering the lunar module’s cone-shaped drogue. The capture latches at the probe tip snap into the socket at the bottom of the cone; then the probe retracts, and twelve latches around the tunnel ring lock the two spacecraft together.`,
    },
    eagleReturns: {
      img: 'as11-44-6642', date: '1969-07-21', mission: 'Apollo 11',
      title: N`Eagle comes home`,
      alt: N`The lunar module ascent stage above the grey lunar surface, with a half-lit Earth on the horizon`,
      story: N`Photographed by Michael Collins from Columbia: Eagle’s ascent stage approaches for rendezvous and docking, with a half-lit Earth above the lunar horizon. Armstrong and Aldrin had lifted off from Tranquility Base less than four hours earlier. The two spacecraft docked at GET 128:03.`,
    },
    earthrise: {
      img: 'as08-14-2383', date: '1968-12-24', mission: 'Apollo 8',
      title: N`Earthrise`,
      alt: N`The Earth, half lit, rising above the grey horizon of the Moon`,
      story: N`Apollo 8, the first crew to leave Earth orbit, flew to the Moon on a free-return trajectory: had the main engine failed, the Moon would have sent them home. Instead they braked into lunar orbit, and on the fourth revolution Bill Anders took this photograph as the Earth rose above the lunar horizon.`,
    },
    apollo13: {
      img: 'as13-59-8500', date: '1970-04-17', mission: 'Apollo 13',
      title: N`Why the free return matters`,
      alt: N`Black-and-white photograph of the Apollo 13 service module with a whole side panel missing`,
      story: N`Apollo 13’s service module, photographed after it was jettisoned shortly before re-entry. An entire panel was blown away when an oxygen tank exploded 56 hours into the flight. With the main engine unusable, the crew fired the lunar module’s descent engine to put the spacecraft back on a free-return trajectory, and the Moon’s gravity brought them home.`,
    },
    eagleUndocks: {
      img: 'as11-44-6584', date: '1969-07-20', mission: 'Apollo 11',
      title: N`Eagle, legs down`,
      alt: N`The lunar module with its landing legs deployed, against black space`,
      story: N`Eagle just after undocking, photographed from Columbia. The landing gear is deployed, and the long probes under the footpads will touch the surface first and light the “contact light”. A few hours later the descent engine burned for about 12½ minutes and spent some 2 km/s of Δv to bring Eagle from orbit to the surface.`,
    },
    ladder: {
      img: 'as11-40-5868', focus: '50% 45%', date: '1969-07-20', mission: 'Apollo 11',
      title: N`The last step`,
      alt: N`An astronaut in a white spacesuit climbing down the ladder of the lunar module`,
      story: N`Buzz Aldrin climbs down Eagle’s ladder, photographed by Neil Armstrong. Behind the gold foil, the descent stage holds the descent engine and its nearly empty propellant tanks. A day later it served as the launch pad for the ascent stage.`,
    },
    hornet: {
      img: 's69-21294', id: 'S69-21294', date: '1969-07-24', mission: 'Apollo 11',
      title: N`Columbia, scorched`,
      alt: N`The Apollo 11 command module, blackened and streaked, lowered onto the deck of a ship by sailors`,
      story: N`Columbia is lowered onto the deck of the recovery ship USS Hornet after splashdown in the Pacific. The dark, streaked surface tells the story of re-entry: the ablative heat shield charred and eroded as designed, carrying away the heat of an 11 km/s entry.`,
    },
    celebration: {
      img: 's69-40022', date: '1969-07-24', mission: 'Apollo 11',
      title: N`Mission accomplished`,
      alt: N`Flight controllers waving small flags and cheering at their consoles`,
      story: N`Flight controllers in the Mission Operations Control Room celebrate the end of Apollo 11: 8 days, 3 hours and 18 minutes after liftoff, the crew is safely aboard the recovery ship.`,
    },
    v2: {
      img: '9131496', focus: '50% 30%', date: '1946', mission: 'White Sands',
      title: N`The first sounding rockets`,
      alt: N`A V-2 rocket lifting off beside its launch tower in the New Mexico desert`,
      story: N`A V-2 lifts off at White Sands, New Mexico, in 1946. After the war the US Army launched more than sixty of these rockets there, many of them carrying instruments that recorded pressure, temperature and radiation far above the reach of balloons. The method of this module began with flights like this one.`,
    },
    j2: {
      img: '6778744', focus: '30% 50%', date: '1967-09-09', mission: 'Saturn V',
      title: N`An engine built for vacuum`,
      alt: N`A J-2 rocket engine firing in a tall steel test stand, a cloud of steam rolling out at its base`,
      story: N`A J-2 engine fires in the S-IVB test stand at the Marshall Space Flight Center. It burned liquid hydrogen with liquid oxygen, for a vacuum specific impulse of about 421 s. Five J-2s powered the Saturn V second stage and one the third stage, which restarted in Earth orbit for translunar injection. Its nozzle was shaped for the near-vacuum of the upper atmosphere, where it did all its work.`,
    },
    gemini6: {
      img: 's65-61804', date: '1965-12-15', mission: 'Gemini 6',
      title: N`Launch on time`,
      alt: N`Engineers at rows of consoles in a blockhouse, television monitors showing the rocket on its pad`,
      story: N`The blockhouse at Launch Complex 19 in the final moments of the Gemini 6 countdown. Gemini 7 was already in orbit. To catch it, Gemini 6 had to lift off inside a short window, when the launch site passed under Gemini 7’s orbital plane with the right phase. It did, and the two spacecraft met in orbit the same day: the first rendezvous between two crewed spacecraft.`,
    },
    surveyor: {
      img: 'as12-48-7134', id: 'AS12-48-7134', date: '1969-11-20', mission: 'Apollo 12',
      title: N`A pinpoint landing`,
      alt: N`An astronaut beside the spindly Surveyor 3 probe on the lunar surface, the lunar module in the distance behind`,
      story: N`Pete Conrad inspects Surveyor 3, an uncrewed probe that had landed in the Ocean of Storms two and a half years earlier. The Apollo 12 lunar module stands in the background. Apollo 11 had come down several kilometres from its aim point; Apollo 12 landed about 180 m from the probe, showing that a powered descent could be targeted to a chosen spot.`,
    },
    receding: {
      img: 'as17-152-23311', date: '1972-12-19', mission: 'Apollo 17',
      title: N`Looking back`,
      alt: N`The Moon, almost full, against black space`,
      story: N`The Moon photographed by the Apollo 17 crew during the coast home in December 1972. The trans-Earth injection burn had been made behind the Moon, out of contact with Earth; from then on the trajectory, refined by small midcourse corrections, decided where and when the capsule would meet the atmosphere.`,
    },
    flightDirectors: {
      img: 's72-54881', id: 'S72-54881', date: '1972-12-06', mission: 'Apollo 17',
      title: N`The flight directors`,
      alt: N`Three men in shirtsleeves talking beside the flight director’s console in Mission Control`,
      story: N`Neil Hutchinson, Eugene Kranz and Gerald Griffin at the flight director’s console during the launch of Apollo 17. Flight directors worked the mission in shifts. During a shift the flight director had the final word; each controller in the room in front of him owned one system or one part of the trajectory.`,
    },
  };

  const src = (c) => `img/history/${c.img}.webp`;
  // NASA IDs are case-sensitive; the file name is lower-case, the record ID is not always
  const nasaId = (c) => c.id || c.img;
  const link = (c) => `https://images.nasa.gov/details/${nasaId(c)}`;
  const fmtDate = (d) => {
    if (d.length === 4) return d;
    const [y, m, day] = d.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, day || 1)).toLocaleDateString(I18N.locale(), day ? { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' } : { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };
  const credit = (c) => `NASA · ${nasaId(c).toUpperCase()} · ${c.mission} · ${fmtDate(c.date)}`;

  const Archive = {
    CAPSULES,
    capsule(key) {
      const c = CAPSULES[key];
      return `<figure class="capsule">
        <button class="capsule-img" type="button" data-capsule="${key}" aria-label="${T`Enlarge photograph`}: ${T(c.title)}">
          <img src="${src(c)}" alt="${T(c.alt)}" loading="lazy" decoding="async"${c.focus ? ` style="object-position:${c.focus}"` : ''}>
        </button>
        <figcaption>
          <span class="capsule-tag">${T`From the archives`}</span>
          <b class="capsule-title">${T(c.title)}</b>
          <span class="capsule-story">${T(c.story)}</span>
          <a class="capsule-credit" href="${link(c)}" target="_blank" rel="noopener">${credit(c)}</a>
        </figcaption>
      </figure>`;
    },
    // just the photo (click to enlarge) and its credit line, for custom layouts
    photo(key) {
      const c = CAPSULES[key];
      return `<button class="capsule-img" type="button" data-capsule="${key}" aria-label="${T`Enlarge photograph`}: ${T(c.title)}"><img src="${src(c)}" alt="${T(c.alt)}" decoding="async"></button>`;
    },
    creditLink(key) { const c = CAPSULES[key]; return `<a class="capsule-credit" href="${link(c)}" target="_blank" rel="noopener">${credit(c)}</a>`; },
    // credits list for the Reference page
    credits() {
      return `<ul class="credits">${Object.values(CAPSULES).map((c) => `<li><a href="${link(c)}" target="_blank" rel="noopener">${nasaId(c).toUpperCase()}</a> · ${T(c.title)} · ${c.mission}, ${fmtDate(c.date)}</li>`).join('')}</ul>`;
    },
  };

  // enlarge on click: one shared <dialog>
  let dlg = null;
  function open(key) {
    const c = CAPSULES[key];
    if (!dlg) {
      dlg = document.createElement('dialog');
      dlg.className = 'lightbox';
      dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('.lb-close')) dlg.close(); });
      document.body.appendChild(dlg);
    }
    dlg.innerHTML = `<button class="btn lb-close" type="button" aria-label="${T`Close`}">✕</button>
      <img src="${src(c)}" alt="${T(c.alt)}">
      <p><b>${T(c.title)}</b> · <a href="${link(c)}" target="_blank" rel="noopener">${credit(c)}</a></p>`;
    dlg.showModal();
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-capsule]');
    if (b) open(b.dataset.capsule);
  });

  window.Archive = Archive;
})();
