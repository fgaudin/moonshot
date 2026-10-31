/* Glossary: technical terms of the course, for the Reference page.
   Term, aliases and definition are data (N), translated where displayed; module = where the term is explained. */
(function () {
  'use strict';
  window.GLOSSARY = [
    { term: N`Ablation; stagnation point`, aka: N`ablative heat shield · heat flux`, def: N`Ablation: the heat shield chars and erodes, carrying heat away. The stagnation point is the spot at the very front of a blunt body, where heating is greatest.`, module: 'entry' },
    { term: N`Abort modes (direct abort, lifeboat)`, aka: N`abort`, def: N`Plans prepared in advance for failures. A direct abort turns the spacecraft around at once with the main engine; lifeboat means using the lunar module's systems, as on Apollo 13.`, module: 'mcc' },
    { term: N`Angle of attack`, def: N`The angle between a vehicle's axis and the airflow it meets. A rocket flying a gravity turn keeps it near zero to avoid side loads; the Apollo capsule flew at about 20°.`, module: 'ascent' },
    { term: N`Apoapsis and periapsis`, aka: N`apogee/perigee (Earth) · apolune/perilune (Moon) · aposelene/periselene · apocynthion/pericynthion · apsides`, def: N`Apoapsis is the highest (farthest) point of an orbit and periapsis the lowest (closest). Around Earth they are apogee and perigee, around the Moon apolune and perilune (also periselene); together they are the apsides.`, module: 'orbits' },
    { term: N`Apollo Guidance Computer`, aka: N`AGC · onboard computer`, def: N`The Apollo onboard computer: it held the state vector, pointed the spacecraft, and fired and cut off the engines from numbers keyed in by the crew.`, module: 'navigation' },
    { term: N`APS`, aka: N`Ascent Propulsion System`, def: N`Ascent Propulsion System: the fixed-thrust 15.6 kN engine of the lunar module's ascent stage. It had no throttle and no backup.`, module: 'landing' },
    { term: N`Attitude (pitch, roll, yaw)`, aka: N`roll · yaw`, def: N`Which way a spacecraft is pointing. It is changed by rotating about three axes: pitch (nose up or down), yaw (nose left or right) and roll (spin about the long axis).`, module: 'docking' },
    { term: N`Ballistic coefficient`, aka: N`β`, def: N`Mass divided by drag coefficient times area (kg/m²). A heavy slim body has a high value and is barely slowed by air; a light broad one has a low value.`, module: 'sounding' },
    { term: N`Bank angle`, aka: N`σ`, def: N`The roll angle of the capsule about its velocity: 0° points lift up, 180° down. It was Apollo's only way to steer during entry.`, module: 'entry' },
    { term: N`Barycentre; three-body problem`, aka: N`circular restricted three-body problem · CR3BP`, def: N`The barycentre is the common centre of mass around which Earth and Moon both circle. The three-body problem, a spacecraft pulled by both, has no closed formula and is integrated numerically.`, module: 'moon' },
    { term: N`Blackout`, aka: N`plasma`, def: N`The 3–4 minutes of lost radio contact during entry, when the superheated air around the capsule ionizes into plasma.`, module: 'entry' },
    { term: N`CAPCOM`, aka: N`capsule communicator`, def: N`The one voice from Mission Control to the crew, always an astronaut in Apollo. CAPCOM reads up PADs and takes the readback.`, module: 'mcc' },
    { term: N`Captured (entry)`, def: N`An entry in which the capsule stays in the atmosphere and slows down to splashdown, instead of skipping back out.`, module: 'entry' },
    { term: N`Centripetal acceleration`, def: N`The inward acceleration, v²/r, needed to make a body follow a circle of radius r at speed v. In orbit gravity supplies it.`, module: 'newton' },
    { term: N`Circular and escape velocity`, aka: N`circular orbital speed · escape speed`, def: N`Circular velocity is the speed at which gravity exactly bends the path into a circle (7.8 km/s near Earth). Escape velocity, √2 times larger, is the speed at which a body never comes back.`, module: 'newton' },
    { term: N`Circularize`, def: N`To burn at an apsis so that the orbit becomes a circle there, usually with a prograde burn at apoapsis.`, module: 'maneuvers' },
    { term: N`Closed-loop guidance`, aka: N`Iterative Guidance Mode · IGM`, def: N`Guidance that recomputes its steering in flight to hit a target altitude, speed and flight-path angle at cutoff, instead of following a fixed table.`, module: 'ascent' },
    { term: N`COAS`, aka: N`Crewman Optical Alignment Sight`, def: N`Crewman Optical Alignment Sight: a reticle in the command module window used to line up on the target docking cross during the final approach.`, module: 'docking' },
    { term: N`Conic sections`, aka: N`circle, ellipse, parabola, hyperbola · focus`, def: N`The four curves you get by slicing a cone: circle, ellipse, parabola, hyperbola. Gravity produces exactly these orbit shapes, with the central body at one focus.`, module: 'orbits' },
    { term: N`CSI, CDH, TPI`, aka: N`rendezvous burn sequence`, def: N`The three standard lunar-rendezvous burns: CSI (constant-delta-height sequence initiation) sets the chase orbit, CDH (constant delta height) fixes the height gap, TPI (terminal phase initiation) starts the final transfer.`, module: 'maneuvers' },
    { term: N`CSM`, aka: N`Command and Service Module · command module · service module`, def: N`Command and Service Module: the Apollo mother ship. The command module is the crew cabin that returns to Earth; the service module behind it carries the main engine, power and supplies.`, module: 'docking' },
    { term: N`Derivative (rate of change)`, aka: N`time derivative`, def: N`The rate of change of a quantity per second. A dot above a letter means this: velocity is the rate of change of position, acceleration the rate of change of velocity.`, module: 'newton' },
    { term: N`DOI`, aka: N`descent orbit insertion`, def: N`Descent orbit insertion: a small retrograde burn (about 23 m/s) that lowers the lunar-orbit periapsis to about 15 km, the starting point of the powered descent.`, module: 'descent' },
    { term: N`Doppler tracking`, aka: N`Doppler shift · radar tracking`, def: N`Measuring a spacecraft's speed along the line of sight from the shift in its radio frequency, as for a passing siren. With ranging by signal timing it gives the orbit.`, module: 'navigation' },
    { term: N`Downrange, crossrange; landing ellipse`, def: N`Downrange is error along the flight path (timing), crossrange error sideways (orbit plane). The landing ellipse is the long, narrow area where the lander may touch down.`, module: 'descent' },
    { term: N`DPS`, aka: N`Descent Propulsion System`, def: N`Descent Propulsion System: the throttleable 45 kN engine of the lunar module's descent stage, used for descent orbit insertion and the powered descent.`, module: 'landing' },
    { term: N`Drag and drag coefficient`, aka: N`C_D`, def: N`Drag is the air's force against the motion, q·C_D·A. The drag coefficient is a shape factor, about 0.3 for a slender rocket.`, module: 'sounding' },
    { term: N`Dry mass`, aka: N`structure mass`, def: N`The mass of a stage without propellant: its tanks, engines and structure.`, module: 'rockets' },
    { term: N`Dynamic pressure and max-q`, aka: N`q · max-q`, def: N`Dynamic pressure, ½ρv², is the force per square metre of the air rushing past. Max-q is the moment of the flight when it peaks, and the structure bears its greatest load.`, module: 'sounding' },
    { term: N`Eagle and Columbia`, aka: N`call signs`, def: N`The call signs of Apollo 11's two spacecraft: Eagle was the lunar module, Columbia the command and service module.`, module: 'landing' },
    { term: N`Eccentricity`, aka: N`e`, def: N`A number with no unit that says how stretched an orbit is: 0 is a circle, between 0 and 1 an ellipse, 1 a parabola, above 1 a hyperbola.`, module: 'orbits' },
    { term: N`Entry corridor`, aka: N`corridor`, def: N`The narrow band of entry angles (−5.3° to −7.4° for Apollo, about 55 km of perigee altitude) in which a capsule is captured and survives: too shallow it skips out, too steep the deceleration is too high.`, module: 'entry' },
    { term: N`Entry interface`, aka: N`EI · 122 km`, def: N`The conventional top of the atmosphere, 122 km altitude, where the entry is reckoned to begin and the entry angle is specified.`, module: 'entry' },
    { term: N`FIDO, GUIDO, RETRO`, aka: N`flight dynamics officer · guidance officer · retrofire officer`, def: N`Mission Control consoles: FIDO plans and tracks the trajectory and computes its burns, GUIDO checks the onboard guidance and computer state, RETRO plans the return to Earth and the aborts.`, module: 'mcc' },
    { term: N`Finite burn`, aka: N`burn time · finite-burn loss`, def: N`A burn that lasts a real time. The spacecraft moves during it, so some Δv is wasted; centring the burn on its burn point keeps the loss small.`, module: 'burns' },
    { term: N`Flight Director, go/no-go, readback`, aka: N`mission rules · air-to-ground loop`, def: N`The Flight Director makes every go/no-go decision, polling each console. Readback means the receiver repeats every number back before it is used.`, module: 'mcc' },
    { term: N`Flight-path angle`, aka: N`γ`, def: N`The angle of the velocity above the local horizontal: 0° when flying level, 90° straight up, negative when descending. It is zero at periapsis and apoapsis.`, module: 'orbits' },
    { term: N`Free-return trajectory`, aka: N`free return`, def: N`A path to the Moon that swings around it and comes back to Earth with no engine burn, so the crew still gets home if the main engine fails. Apollo 8, 10 and 11 flew one.`, module: 'moon' },
    { term: N`g (multiples of gravity)`, aka: N`g-load · G-force`, def: N`A way to state acceleration as a multiple of Earth's standard gravity, 9.81 m/s². At 4 g you feel four times your normal weight.`, module: 'rockets' },
    { term: N`Geostationary orbit, GEO, LEO, GTO`, aka: N`geostationary · low Earth orbit · geostationary transfer orbit`, def: N`Geostationary orbit (GEO) is the circular equatorial orbit 35 786 km high with a period of one day, so a satellite hangs over one spot. Low Earth orbit (LEO) is a few hundred km up; a geostationary transfer orbit (GTO) is the ellipse linking the two.`, module: 'orbits' },
    { term: N`GET (ground elapsed time)`, aka: N`mission clock`, def: N`Ground elapsed time: the mission clock, counted in hours, minutes and seconds since liftoff. All burns and events are timed in GET, not in calendar time.`, module: 'timing' },
    { term: N`Gimbal`, aka: N`gimbal angles`, def: N`A pivot mount that lets an engine swing a few degrees to steer the thrust. The ascent engine had none, so it could only be aimed by turning the whole spacecraft.`, module: 'landing' },
    { term: N`Gravitational parameter (μ)`, aka: N`μ · GM`, def: N`The product G·M of a body, which sets the strength of its gravity. For Earth it is 3.986 × 10¹⁴ m³/s²; for the Moon 4.903 × 10¹² m³/s².`, module: 'newton' },
    { term: N`Gravity assist`, aka: N`flyby · turn angle`, def: N`Passing close to a moving body so that its gravity turns your velocity relative to it. In the Sun-Earth frame this changes your speed and direction without engine use.`, module: 'moon' },
    { term: N`Gravity turn`, def: N`A way of steering in which thrust follows the airflow and gravity itself bends the path toward the horizontal, so there is no aerodynamic side load.`, module: 'ascent' },
    { term: N`Gravity well`, aka: N`potential energy`, def: N`A picture of gravity as a hole: the deeper you are, the more energy per kilogram you need to climb out. Its depth at distance r is μ/r.`, module: 'newton' },
    { term: N`Gravity, drag and steering losses`, aka: N`gravity loss · drag loss · steering loss`, def: N`Δv that a launch loses on top of orbital speed: gravity loss (thrust spent holding the rocket up while climbing, 1–1.5 km/s), drag loss (air resistance) and steering loss (thrust not pointed along the path).`, module: 'ascent' },
    { term: N`High gate, low gate`, def: N`Checkpoints in the lunar descent: high gate (about 2.3 km up) starts the final approach and low gate (about 150 m) the semi-manual landing phase.`, module: 'landing' },
    { term: N`Hohmann transfer`, aka: N`two-impulse transfer · transfer ellipse`, def: N`The cheapest two-burn way between two circular orbits in one plane: an ellipse touching the inner orbit at its periapsis and the outer at its apoapsis.`, module: 'maneuvers' },
    { term: N`Hover margin`, aka: N`hover time`, def: N`Spare propellant expressed as seconds the lander could hover. Mission Control called it out aloud during Apollo 11's descent.`, module: 'descent' },
    { term: N`Hydrostatic equilibrium; datum`, aka: N`datum`, def: N`Each layer of air is held up by the pressure difference across it, so pressure falls with height by ρg per metre. The datum is the reference level where height is zero.`, module: 'sounding' },
    { term: N`Hyperbolic excess speed (v∞)`, aka: N`v∞ · v-infinity · hyperbolic excess`, def: N`The speed a spacecraft still has relative to a body when far from it, after gravity's pull is discounted. It decides the shape of the flyby or departure hyperbola.`, module: 'moon' },
    { term: N`Impulsive burn`, aka: N`impulse · instant kick`, def: N`A burn idealised as an instant change of velocity. A real burn lasts seconds or minutes, which is why finite burns are planned around the ignition time.`, module: 'burns' },
    { term: N`Inclination`, aka: N`i`, def: N`The tilt of an orbit plane relative to the equator, from 0° to 180°. An orbit inclined 28.5° never goes beyond latitude 28.5°.`, module: 'planes' },
    { term: N`Inertial speed and inertial frame`, aka: N`inertial`, def: N`Speed measured in a frame that does not turn with the Earth, fixed relative to the stars. Orbital speed is always quoted this way.`, module: 'ascent' },
    { term: N`Kepler's laws`, aka: N`equal areas · period law`, def: N`Orbits are ellipses; the line to the central body sweeps equal areas in equal times (so speed is highest at periapsis); and the period depends only on the semi-major axis.`, module: 'orbits' },
    { term: N`Launch azimuth`, aka: N`azimuth`, def: N`The compass direction of a launch, measured clockwise from north: 90° is due east. It sets the inclination of the orbit reached.`, module: 'planes' },
    { term: N`Launch window`, def: N`The short time when a launch (or ascent) is possible because the site passes under the target orbit plane with the right phase.`, module: 'planes' },
    { term: N`Lift and lift-to-drag ratio`, aka: N`L/D`, def: N`Lift is the sideways aerodynamic force on a tilted capsule; L/D is its ratio to drag (0.3 for Apollo). Lift up makes the entry gentler, lift down steeper.`, module: 'entry' },
    { term: N`LM`, aka: N`Lunar Module · Eagle (Apollo 11)`, def: N`Lunar Module: the two-stage lander that took two astronauts to the Moon's surface. The descent stage landed it; the ascent stage flew back up to the command module.`, module: 'landing' },
    { term: N`LOI`, aka: N`lunar orbit insertion`, def: N`Lunar orbit insertion: the braking burn, made behind the Moon, that captures an arriving spacecraft into orbit around it. Apollo 11's first LOI cost 889 m/s.`, module: 'moon' },
    { term: N`LOS and AOS`, aka: N`loss of signal · acquisition of signal`, def: N`Loss of signal and acquisition of signal: the moments radio contact stops and resumes, for example when the spacecraft passes behind the Moon.`, module: 'mcc' },
    { term: N`Maneuver frame (normal, radial, LVLH)`, aka: N`LVLH · local vertical frame`, def: N`The axes used to describe a Δv: prograde along the velocity, normal perpendicular to the orbit plane, radial in the plane. LVLH means local vertical, local horizontal: axes tied to "straight up" and "horizontal" at the spacecraft.`, module: 'burns' },
    { term: N`MCC`, aka: N`midcourse correction`, def: N`Midcourse correction: a small burn, a few m/s, on the way to or from the Moon that cancels the error left by the big burns. The earlier it is made, the cheaper it is.`, module: 'mcc' },
    { term: N`Mean anomaly, eccentric anomaly, mean motion; Kepler's equation`, aka: N`mean motion · M · E · n`, def: N`Helper quantities for finding where a spacecraft is at a given time: mean motion is the average angular rate, mean anomaly an angle growing steadily with time, and Kepler's equation links it to the real position (solved by iteration).`, module: 'orbits' },
    { term: N`Momentum`, def: N`Mass times velocity: the quantity of motion of a body. Force is the rate at which momentum changes.`, module: 'newton' },
    { term: N`Node`, aka: N`ascending node · descending node · line of nodes`, def: N`A point where an orbit crosses the equator (or another reference plane): ascending if going north, descending if going south. Plane changes are cheapest at a node.`, module: 'planes' },
    { term: N`Nozzle expansion (over-/under-expanded)`, aka: N`expansion ratio`, def: N`The nozzle's exit-to-throat area ratio. A larger ratio converts more heat into exhaust speed; the nozzle is over-expanded when exit pressure is below the outside air pressure, under-expanded when above.`, module: 'launcher' },
    { term: N`Orbit size notation ("111 × 312 km")`, aka: N`one-eleven by three-twelve`, def: N`How orbits are quoted: lowest altitude by highest altitude above the surface, in km. "111 × 312" is a 111 km periapsis and a 312 km apoapsis.`, module: 'orbits' },
    { term: N`P63, P64, P66`, aka: N`guidance programs`, def: N`The lunar module computer's descent programs: P63 braking, P64 approach, P66 the semi-manual landing in which the commander sets the descent rate.`, module: 'landing' },
    { term: N`PAD`, aka: N`maneuver PAD · pre-advisory data`, def: N`The standard form read up to the crew with the data of a burn: ignition time, Δv components, attitude, burn time and the expected resulting orbit.`, module: 'burns' },
    { term: N`Parking orbit`, aka: N`Earth parking orbit · lunar parking orbit`, def: N`A temporary near-circular orbit in which a spacecraft waits before its next burn. Apollo waited in a 185 km circular orbit around the Earth before trans-lunar injection.`, module: 'ascent' },
    { term: N`PC+2`, aka: N`pericynthion plus 2 hours`, def: N`The burn about two hours after closest approach to the Moon ("pericynthion plus 2"), used on Apollo 13 to speed up the return.`, module: 'moon' },
    { term: N`PDI`, aka: N`powered descent initiation`, def: N`Powered descent initiation: the ignition of the descent engine at periapsis, about 15 km up and some 400 km before the landing site.`, module: 'descent' },
    { term: N`Perturbations; oblateness (J2)`, aka: N`J2 · oblate`, def: N`Perturbations are small extra forces that make a real orbit differ from the ideal two-body path: Earth's slightly flattened (oblate) shape, called J2, the Sun and Moon, drag and sunlight.`, module: 'newton' },
    { term: N`Phase angle and lead angle`, aka: N`phasing`, def: N`The angle, seen from the planet's centre, by which a target is ahead of a chaser. The lead angle is the value it must have when the transfer starts so both arrive together.`, module: 'timing' },
    { term: N`Pitch program`, aka: N`pitch-over · pitch kick · pitch`, def: N`The table of pitch angles against time, written on the ground, that steers a rocket from vertical to horizontal. The pitch-over or kick is its first small tilt; pitch is measured from the vertical.`, module: 'launcher' },
    { term: N`Plane change`, aka: N`bi-elliptic transfer`, def: N`A burn that tilts the orbit plane without changing speed. It costs Δv = 2v·sin(Δi/2), so it is cheapest where the speed is lowest.`, module: 'planes' },
    { term: N`Prograde and retrograde`, aka: N`normal · antinormal · radial`, def: N`Prograde is along the direction of motion, retrograde against it. A prograde burn raises the opposite side of the orbit, a retrograde burn lowers it.`, module: 'burns' },
    { term: N`Propellants (RP-1, LOX, LH₂, hypergolic)`, aka: N`kerosene · liquid oxygen · liquid hydrogen`, def: N`The fuel and oxidizer a rocket burns: RP-1 is kerosene, LOX liquid oxygen, LH₂ liquid hydrogen. Hypergolic propellants ignite on contact, so no igniter is needed.`, module: 'rockets' },
    { term: N`RAAN and argument of periapsis`, aka: N`right ascension of the ascending node · Ω · ω · argument of latitude`, def: N`RAAN is the angle, measured along the equator from a fixed direction in space, to the point where the orbit climbs through the equator. The argument of periapsis is the angle from that point to periapsis.`, module: 'planes' },
    { term: N`RCS`, aka: N`Reaction Control System · thrusters`, def: N`Reaction Control System: the small thrusters (445 N each on Apollo's service module) used to turn the spacecraft and to nudge it sideways or forward in docking.`, module: 'docking' },
    { term: N`Reference frame; Coriolis; Clohessy–Wiltshire`, aka: N`relative motion · V-bar · R-bar`, def: N`A reference frame is the point of view you measure from. In the target's orbiting frame a chaser feels apparent forces (Coriolis terms); the Clohessy–Wiltshire equations describe this relative motion.`, module: 'docking' },
    { term: N`Rendezvous and lunar orbit rendezvous`, aka: N`LOR · chaser · target`, def: N`Rendezvous is bringing two spacecraft to the same place with the same velocity. Lunar orbit rendezvous is the Apollo plan: the lander leaves the mother ship in lunar orbit and must find it again.`, module: 'maneuvers' },
    { term: N`Rocket equation, mass ratio`, aka: N`Tsiolkovsky equation · MR`, def: N`Δv = exhaust speed × ln(initial mass / final mass). The mass ratio is that initial-to-final mass ratio; to gain more Δv you must multiply it, not add.`, module: 'rockets' },
    { term: N`Root-sum-square; 3σ; dispersion`, aka: N`RSS`, def: N`Independent errors combine as the square root of the sum of their squares. 3σ is three times that value, the planning size of the error; dispersion is the scatter of actual burns around the plan.`, module: 'mcc' },
    { term: N`Rotating frame`, aka: N`Earth–Moon rotating frame`, def: N`A point of view that turns with the Earth–Moon line, so both bodies appear fixed. In it, a free-return path traces a figure eight.`, module: 'moon' },
    { term: N`Saturn V stages (S-IC, S-II, S-IVB)`, aka: N`first stage · second stage · third stage`, def: N`The three stages of the Saturn V: the S-IC (five F-1 engines) lifts off, the S-II (five J-2) takes over, and the S-IVB (one J-2) reaches orbit and later fires again for trans-lunar injection.`, module: 'rockets' },
    { term: N`Scale height`, aka: N`H`, def: N`The climb over which air pressure and density drop by a factor e (63 %). About 7 km for Earth's lower atmosphere.`, module: 'sounding' },
    { term: N`Semi-major axis`, aka: N`a · semi-latus rectum`, def: N`Half the longest diameter of an ellipse. It alone fixes the orbit's energy and period.`, module: 'orbits' },
    { term: N`Sensitivity and 1σ error`, aka: N`sigma · standard deviation`, def: N`Sensitivity is how much an answer moves per unit of error in a reading. 1σ (one standard deviation) is the typical size of an instrument's random error.`, module: 'navigation' },
    { term: N`Skip, overshoot, undershoot`, aka: N`skip-out`, def: N`Overshoot: entering too shallow, so the capsule skips back out to space. Undershoot: too steep, so deceleration and heating exceed limits.`, module: 'entry' },
    { term: N`Soft dock, hard dock, probe and drogue`, aka: N`capture latches`, def: N`In Apollo the probe on the command module entered the funnel-shaped drogue of the lunar module and capture latches closed (soft dock); a retraction then pulled the craft together and twelve latches locked (hard dock).`, module: 'docking' },
    { term: N`Specific angular momentum`, aka: N`angular momentum · h`, def: N`Angular momentum per kilogram: radius times the sideways speed. It stays constant on a coasting orbit, fixes the orbit's shape and keeps its plane from changing.`, module: 'orbits' },
    { term: N`Specific energy`, aka: N`specific mechanical energy · ε`, def: N`Orbital energy per kilogram, kinetic plus potential, in J/kg. It stays constant on a coasting orbit; negative means the orbit is bound.`, module: 'orbits' },
    { term: N`Specific impulse (Isp)`, aka: N`Isp · kilogram-force`, def: N`A measure of engine efficiency in seconds: thrust divided by propellant weight flow, equal to the exhaust speed divided by 9.81 m/s². Higher is better; chemical rockets top out near 450 s.`, module: 'rockets' },
    { term: N`Sphere of influence, patched conics`, aka: N`SOI · r_SOI`, def: N`The sphere of influence is the zone around a body where its gravity dominates. Patched conics treat a trip as separate two-body orbits, Earth-centred then Moon-centred, joined at that boundary.`, module: 'moon' },
    { term: N`SPS`, aka: N`Service Propulsion System`, def: N`Service Propulsion System: the 91 kN main engine of the Apollo service module, used for course corrections, lunar orbit insertion and the burn home.`, module: 'moon' },
    { term: N`Staging`, aka: N`stage`, def: N`Dropping each stage's empty structure when its propellant is used up, so the rocket equation restarts with a smaller mass. It is why rockets reach orbit.`, module: 'rockets' },
    { term: N`State vector`, aka: N`state`, def: N`The position and velocity of a spacecraft at one instant. Together they fix the whole orbit.`, module: 'navigation' },
    { term: N`Suborbital`, def: N`A path whose periapsis is below the surface, so the vehicle falls back and hits the ground instead of completing an orbit.`, module: 'navigation' },
    { term: N`Synodic period`, def: N`The time between two identical alignments of two bodies in different orbits: how long you wait for the next rendezvous opportunity.`, module: 'timing' },
    { term: N`TEI`, aka: N`trans-Earth injection`, def: N`Trans-Earth injection: the burn in lunar orbit, made behind the Moon, that sends the spacecraft back toward Earth. Apollo 11's cost about 1 km/s.`, module: 'homeward' },
    { term: N`Telemetry`, def: N`Measurements sent down by radio from the spacecraft: altitude, speed, temperatures and so on, as a stream of numbers.`, module: 'navigation' },
    { term: N`Thrust, mass flow, exhaust velocity`, aka: N`effective exhaust velocity · thrust equation`, def: N`Thrust is the push of the engine, equal to the propellant mass flow (kg/s) times the exhaust speed, plus a small pressure term at the nozzle.`, module: 'rockets' },
    { term: N`TIG`, aka: N`time of ignition`, def: N`Time of ignition: the moment, in GET, when the engine lights. Mission Control sets it half a burn time before the burn point, the instant of the impulsive plan, so the burn is centred on that point.`, module: 'burns' },
    { term: N`TLI`, aka: N`trans-lunar injection · translunar injection`, def: N`Trans-lunar injection: the burn that sends a spacecraft from Earth parking orbit onto a path to the Moon. Apollo's S-IVB fired for about six minutes, adding roughly 3.1 km/s.`, module: 'moon' },
    { term: N`Transposition, docking and extraction`, aka: N`transposition`, def: N`The manoeuvre about three hours after launch in which the command module separates from the spent S-IVB, turns around, docks with the lunar module stowed on top and pulls it out.`, module: 'docking' },
    { term: N`True anomaly`, aka: N`ν`, def: N`The angle, seen from the planet's centre, from periapsis to the spacecraft: it tells where you are on the orbit.`, module: 'orbits' },
    { term: N`Two-body problem`, aka: N`two-body equation`, def: N`The motion of a small body attracted only by one large body. It has an exact solution: a circle, ellipse, parabola or hyperbola.`, module: 'newton' },
    { term: N`TWR (thrust-to-weight ratio)`, aka: N`thrust-to-weight`, def: N`Engine thrust divided by the vehicle's weight. Above 1 the rocket can lift off; the Saturn V started at 1.18.`, module: 'rockets' },
    { term: N`UTC`, aka: N`Coordinated Universal Time`, def: N`Coordinated Universal Time, the world's standard clock (close to Greenwich time). It is used here only to give the real liftoff time of Apollo 11.`, module: 'home' },
    { term: N`Vacuum perigee`, def: N`The perigee altitude a returning path would have if there were no air. It is used to describe how steeply a capsule will enter.`, module: 'homeward' },
    { term: N`Vector, scalar, dot and cross product`, aka: N`vector · scalar`, def: N`A vector is a quantity with size and direction (an arrow), such as velocity; a scalar is just a number, such as speed. The dot product measures how much two arrows point the same way, the cross product gives an arrow perpendicular to both.`, module: 'newton' },
    { term: N`Vernal equinox direction`, aka: N`x axis`, def: N`The fixed reference direction in space from which right ascension is measured: where the Sun crosses the equator northward in March.`, module: 'planes' },
    { term: N`Vis-viva equation`, aka: N`energy equation`, def: N`The equation v = √(μ(2/r − 1/a)): it gives your speed anywhere on an orbit from your distance r and the semi-major axis a.`, module: 'orbits' },
    { term: N`Δv (delta-v)`, aka: N`velocity change`, def: N`Delta-v is the change of velocity a burn produces, in m/s. Every manoeuvre of a mission is priced in delta-v, and the rocket equation turns it into propellant.`, module: 'rockets' },
    { term: N`Δv margin`, aka: N`margin · Δv budget`, def: N`The Δv left in a stage after the planned burns and their 3σ dispersions are paid for, as a percentage of the Δv needed.`, module: 'mcc' },
  ];

  /* ---------- glossary tooltips in the course text ----------
     The words of each entry (term parts first, then aliases) are looked for in the prose of a page; the first
     occurrence in each section gets a dotted underline and the definition as a tooltip (shown by js/symbols.js).
     Words that are too common to be useful as links are listed in STOP. */
  const AND = { en: ' and ', fr: ' et ', de: ' und ' };
  const STOP = {
    en: 'earth moon entry state dot normal radial antinormal target chaser stage staging margin circle ellipse parabola hyperbola focus gravity drag pitch roll yaw attitude plasma inertial impulse docking extraction transposition eagle columbia datum probe drogue captured capture skip abort corridor node vector scalar thrust thrusters phasing flyby oblate lifeboat readback derivative dispersion sigma azimuth gimbal propellants kerosene lift lifts',
    fr: 'terre lune rentrée état normal normale radial radiale antinormale cible poursuivant marge cercle ellipse parabole hyperbole foyer tangage roulis lacet attitude plasma inertiel impulsion amarrage extraction transposition eagle columbia datum sonde capture capturée rebond abandon couloir nœud vecteur scalaire poussée poids propulseurs phasage survol aplati collationnement dérivée dispersion sigma azimut cardan gimbal ergols kérosène stage staging indicatifs étage étages traînée',
    de: 'erde mond wiedereintritt zustand normal radial antinormal ziel verfolger reserve kreis ellipse parabel hyperbel brennpunkt nicken rollen gieren lage plasma inertial andocken herausziehen transposition eagle columbia datum fang eingefangen abprallen abbruch korridor knoten vektor skalar schub steuertriebwerke phasierung vorbeiflug abgeplattet rettungsboot rücklesen ableitung streuung sigma azimut gimbal kardanaufhängung treibstoffe kerosin stage staging rufzeichen stufe stufen luftwiderstand',
  };
  const PLURAL = { en: '(?:s|es)?', fr: '(?:s|x)?', de: '(?:e|en|n|s|es|er)?' };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let cache = null;
  function matcher() {
    const lang = (window.I18N && I18N.lang) || 'en';
    if (cache && cache.lang === lang) return cache;
    const stop = new Set(STOP[lang].split(' ')), seen = new Map();
    const phrases = (txt) => {
      const out = [];
      const add = (p) => {
        p = p.trim().replace(/^(the|a|an|le|la|les|l’|der|die|das)\s+/i, '');
        if (/[\d_()]|-$|^-|^(de|du|des|par|of|von|der) /i.test(p) || (p.match(/\p{L}/gu) || []).length < 3 || stop.has(p.toLowerCase())) return;
        out.push(p);
      };
      for (let part of txt.split(/;|·|\//)) {
        const paren = part.match(/\(([^)]*)\)/);
        if (paren) paren[1].split(',').forEach(add);
        part = part.replace(/\([^)]*\)/g, '');
        const bits = part.split(AND[lang]);
        // "Circular and escape velocity" also names "circular velocity"
        if (lang === 'en' && bits.length === 2 && !/\s/.test(bits[0].trim()) && bits[1].trim().split(/\s+/).length === 2 && !bits[1].toLowerCase().includes(bits[0].trim().toLowerCase())) {
          add(`${bits[0].trim()} ${bits[1].trim().split(/\s+/)[1]}`); add(bits[1]);     // not the bare adjective
        } else for (const b of bits) b.split(',').forEach(add);
      }
      return out;
    };
    // terms first, then aliases: a word that is an entry's own term is never claimed by another entry's alias
    window.GLOSSARY.forEach((e, i) => phrases(T(e.term)).forEach((p) => { if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), { p, i }); }));
    window.GLOSSARY.forEach((e, i) => e.aka && phrases(T(e.aka)).forEach((p) => { if (!seen.has(p.toLowerCase())) seen.set(p.toLowerCase(), { p, i }); }));
    const list = [...seen.values()].sort((a, b) => b.p.length - a.p.length);
    const strict = (p) => (p.match(/\p{Lu}/gu) || []).length >= 2 || /^\p{Lu}\p{Ll}*\p{Lu}/u.test(p) || p === 'Isp';
    const alt = (arr) => arr.map((x) => esc(x.p).replace(/[-–‐]/g, '[-–‐]') + PLURAL[lang]).join('|');
    const strictList = list.filter((x) => strict(x.p)), looseList = list.filter((x) => !strict(x.p));
    const B = '(?<![\\p{L}\\p{N}])', A = '(?![\\p{L}\\p{N}])';
    cache = {
      lang,
      re: strictList.length ? new RegExp(`${B}(?:${alt(strictList)})${A}`, 'gu') : null,      // acronyms and capitalised names: exact case
      reI: looseList.length ? new RegExp(`${B}(?:${alt(looseList)})${A}`, 'giu') : null,     // ordinary words: any case
      find(word, cs) {
        const w = word.toLowerCase(), pool = cs ? strictList : looseList;
        const hit = pool.find((x) => w === x.p.toLowerCase() || (w.startsWith(x.p.toLowerCase()) && new RegExp(`^${esc(x.p.toLowerCase())}${PLURAL[lang]}$`, 'u').test(w)));
        return hit ? hit.i : -1;
      },
    };
    return cache;
  }

  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'MJX-CONTAINER', 'ABBR', 'CANVAS', 'BUTTON', 'A', 'H1', 'H2', 'H3', 'H4', 'LABEL', 'SUMMARY', 'FIGURE', 'CODE', 'DT']);
  const BOLD = new Set(['B', 'STRONG']);
  const used = new WeakMap();                 // section element → entries already linked in it
  function wrap(root) {
    if (!window.I18N || !root || (root.closest && root.closest('#page') && location.hash === '#reference')) return;
    const m = matcher();
    const prose = root.matches && root.matches('.prose') ? [root] : [...(root.querySelectorAll ? root.querySelectorAll('.prose') : [])];
    if (!prose.length && root.closest) { const p = root.closest('.prose'); if (p) prose.push(root); }
    for (const pr of prose) {
      const walker = document.createTreeWalker(pr, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          for (let p = n.parentNode; p && p !== pr.parentNode; p = p.parentNode) if (SKIP.has(p.nodeName) || (p.classList && (p.classList.contains('eq') || p.classList.contains('where') || p.classList.contains('lab')))) return NodeFilter.FILTER_REJECT;
          return /\\\(|\\\[/.test(n.nodeValue) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        },
      });
      const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
      for (const n of nodes) {
        const sec = (n.parentNode.closest && n.parentNode.closest('section')) || pr;
        if (!used.has(sec)) used.set(sec, new Set());
        const done = used.get(sec), inBold = BOLD.has(n.parentNode.nodeName);
        const txt = n.nodeValue, hits = [], taken = [];
        for (const [re, cs] of [[m.re, true], [m.reI, false]]) {
          if (!re) continue;
          re.lastIndex = 0;
          for (let r; (r = re.exec(txt));) {
            if (taken.some(([a, b]) => r.index < b && a < r.index + r[0].length)) continue;
            taken.push([r.index, r.index + r[0].length]);
            const i = m.find(r[0], cs);
            if (i >= 0 && !done.has(i)) { done.add(i); if (!inBold) hits.push([r.index, r[0], i]); }
          }
        }
        if (!hits.length) continue;
        hits.sort((a, b) => a[0] - b[0]);
        const frag = document.createDocumentFragment(); let last = 0;
        for (const [at, word, i] of hits) {
          if (at < last) continue;
          if (at > last) frag.appendChild(document.createTextNode(txt.slice(last, at)));
          const a = document.createElement('abbr'); a.className = 'gl'; a.dataset.gl = i; a.textContent = word;
          frag.appendChild(a); last = at + word.length;
        }
        if (last < txt.length) frag.appendChild(document.createTextNode(txt.slice(last)));
        n.parentNode.replaceChild(frag, n);
      }
    }
  }
  window.Gloss = { wrap, entry: (i) => window.GLOSSARY[+i] };
})();
