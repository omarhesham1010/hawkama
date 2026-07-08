import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const distDir = join(process.cwd(), 'dist');
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

const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="hawkama-governance-module"
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

  <organizations default="ORG-GOVERNANCE">
    <organization identifier="ORG-GOVERNANCE" adlseq:objectivesGlobalToSystem="false">
      <title>الحوكمة والمخاطر والامتثال</title>
      <item identifier="ITEM-GOVERNANCE-CH1" identifierref="RES-GOVERNANCE-CH1" isvisible="true">
        <title>الحوكمة والمخاطر والامتثال - المقدمة والفصول الثلاثة</title>
        <imsss:sequencing>
          <imsss:controlMode choice="true" flow="true" />
          <imsss:deliveryControls completionSetByContent="true" objectiveSetByContent="true" />
        </imsss:sequencing>
      </item>
    </organization>
  </organizations>

  <resources>
    <resource identifier="RES-GOVERNANCE-CH1" type="webcontent" adlcp:scormType="sco" href="index.html">
${fileNodes}
    </resource>
  </resources>
</manifest>
`;

writeFileSync(manifestPath, manifest, 'utf8');
console.log(`SCORM manifest written with ${files.length} file(s).`);
