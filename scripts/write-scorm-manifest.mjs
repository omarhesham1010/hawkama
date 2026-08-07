import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const SAMPLE = process.argv.includes('--sample');
const courseArg = process.argv.find((arg) => arg.startsWith('--course='));
const COURSE = courseArg ? courseArg.slice('--course='.length) : null;

const COURSE_TITLES = {
  1: 'الحوكمة والمخاطر والامتثال',
  2: 'إدارة الاستجابة للطوارئ',
  3: 'ترخيص المنشآت الصحية والقوى العاملة',
  4: 'إعداد السياسات والأنظمة واللوائح في القطاع الصحي',
  5: 'حوكمة القطاع الصحي',
};
const COURSE_IDENTIFIERS = {
  1: 'hawkama-governance-course',
  2: 'hawkama-emergency-course',
  3: 'hawkama-licensing-course',
  4: 'hawkama-policy-course',
  5: 'hawkama-governance2-course',
};

const distDir = join(process.cwd(), SAMPLE ? 'dist-sample' : COURSE ? `dist-course${COURSE}` : 'dist');
const manifestPath = join(distDir, 'imsmanifest.xml');

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) entries.push(...walk(full));
    else entries.push(relative(distDir, full).split(sep).join('/'));
  }
  return entries;
}

function xmlEscape(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

const files = walk(distDir)
  .filter((file) => file !== 'imsmanifest.xml')
  .sort();

const fileNodes = files.map((file) => `      <file href="${xmlEscape(file)}" />`).join('\n');

const organizationItems = SAMPLE
  ? `      <item identifier="ITEM-EMERGENCY-SAMPLE" identifierref="RES-PLATFORM" isvisible="true">
        <title>إدارة الاستجابة للطوارئ - نموذج أولي (أول شريحتين)</title>
        <imsss:sequencing>
          <imsss:controlMode choice="true" flow="true" />
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" />
        </imsss:sequencing>
      </item>`
  : COURSE
    ? `      <item identifier="ITEM-COURSE-${COURSE}" identifierref="RES-PLATFORM" isvisible="true">
        <title>${xmlEscape(COURSE_TITLES[COURSE])}</title>
        <imsss:sequencing>
          <imsss:controlMode choice="true" flow="true" />
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" />
        </imsss:sequencing>
      </item>`
    : `      <item identifier="ITEM-GOVERNANCE" identifierref="RES-PLATFORM" isvisible="true">
        <title>الحوكمة والمخاطر والامتثال</title>
        <imsss:sequencing>
          <imsss:controlMode choice="true" flow="true" />
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" />
        </imsss:sequencing>
      </item>
      <item identifier="ITEM-EMERGENCY" identifierref="RES-PLATFORM" isvisible="true">
        <title>إدارة الاستجابة للطوارئ</title>
        <imsss:sequencing>
          <imsss:controlMode choice="true" flow="true" />
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" />
        </imsss:sequencing>
      </item>`;

const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${SAMPLE ? 'hawkama-emergency-sample-module' : COURSE ? COURSE_IDENTIFIERS[COURSE] : 'hawkama-governance-module'}"
  version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:adlseq="http://www.adlnet.org/xsd/adlseq_v1p3"
  xmlns:adlnav="http://www.adlnet.org/xsd/adlnav_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 imscp_v1p1.xsd
                      http://www.adlnet.org/xsd/adlcp_v1p3 adlcp_v1p3.xsd
                      http://www.adlnet.org/xsd/adlseq_v1p3 adlseq_v1p3.xsd
                      http://www.adlnet.org/xsd/adlnav_v1p3 adlnav_v1p3.xsd
                      http://www.imsglobal.org/xsd/imsss imsss_v1p0.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>2004 4th Edition</schemaversion>
  </metadata>

  <organizations default="ORG-PLATFORM">
    <organization identifier="ORG-PLATFORM" adlseq:objectivesGlobalToSystem="false">
      <title>${SAMPLE ? 'نموذج أولي - إدارة الاستجابة للطوارئ' : COURSE ? xmlEscape(COURSE_TITLES[COURSE]) : 'منصة التدريب الرقمي'}</title>
${organizationItems}
    </organization>
  </organizations>

  <resources>
    <resource identifier="RES-PLATFORM" type="webcontent" adlcp:scormType="sco" href="index.html">
${fileNodes}
    </resource>
  </resources>
</manifest>
`;

writeFileSync(manifestPath, manifest, 'utf8');
console.log(`SCORM manifest written with ${files.length} file(s) to ${SAMPLE ? 'dist-sample' : COURSE ? `dist-course${COURSE}` : 'dist'}/imsmanifest.xml.`);
