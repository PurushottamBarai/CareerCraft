const { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, AlignmentType, TabStopPosition, TabStopType, DocumentObject, Tab } = require('docx');

// Helper to create a section heading
function createSectionHeading(text) {
    return new Paragraph({
        children: [
            new TextRun({
                text: text,
                font: "Times New Roman",
                size: 22, 
                bold: true,
            }),
        ],
        spacing: { before: 200, after: 100 },
        border: {
            bottom: {
                color: "000000",
                space: 1,
                style: BorderStyle.SINGLE,
                size: 6,
            },
        },
    });
}

function createBullet(text, boldPrefix = "") {
    const children = [];
    if (boldPrefix) {
        children.push(new TextRun({ text: boldPrefix, bold: true, font: "Times New Roman", size: 20 }));
        children.push(new TextRun({ text: text, font: "Times New Roman", size: 20 }));
    } else {
        children.push(new TextRun({ text: text, font: "Times New Roman", size: 20 }));
    }

    return new Paragraph({
        children: children,
        bullet: { level: 0 },
        spacing: { before: 40, after: 40 },
    });
}

async function generateResumeDocx(resumeData) {
    const sections = [];

    // Header Content
    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: resumeData.personalInfo.name || "Your Name",
                    font: "Times New Roman",
                    size: 56, // 28pt
                    bold: true,
                }),
            ],
            spacing: { after: 100 },
            alignment: AlignmentType.LEFT,
        })
    );

    // Contact Line
    const contacts = [];
    if (resumeData.personalInfo.email) contacts.push(resumeData.personalInfo.email);
    if (resumeData.personalInfo.phone) contacts.push(resumeData.personalInfo.phone);
    if (resumeData.personalInfo.location) contacts.push(resumeData.personalInfo.location);
    if (resumeData.personalInfo.github) contacts.push(resumeData.personalInfo.github);
    if (resumeData.personalInfo.linkedin) contacts.push(resumeData.personalInfo.linkedin);

    sections.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: contacts.filter(Boolean).join("  |  "),
                    font: "Times New Roman",
                    size: 20, // 10pt
                }),
            ],
            spacing: { after: 200 },
            alignment: AlignmentType.LEFT,
        })
    );

    // Summary
    if (resumeData.personalInfo.summary && resumeData.personalInfo.summary !== "N/A") {
        sections.push(
            new Paragraph({
                children: [
                    new TextRun({ text: resumeData.personalInfo.summary, font: "Times New Roman", size: 20 })
                ],
                spacing: { before: 100, after: 200 }
            })
        );
    }

    // Education
    if (resumeData.education && resumeData.education.length > 0) {
        sections.push(createSectionHeading("Education"));
        resumeData.education.forEach((edu) => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: edu.degree + " ", font: "Times New Roman", size: 22, bold: true }),
                        new Tab(),
                        new TextRun({ text: `${edu.year || ""}`, font: "Times New Roman", size: 20 }),
                    ],
                    tabStops: [{ type: TabStopType.RIGHT, position: 10080 }],
                    spacing: { before: 100, after: 40 },
                })
            );
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: edu.institution, font: "Times New Roman", size: 20, italics: true }),
                    ],
                    spacing: { after: 40 },
                })
            );
            if (edu.grade) {
                sections.push(
                    new Paragraph({
                        children: [
                            new TextRun({ text: `CGPA/Percentage: ${edu.grade}`, font: "Times New Roman", size: 20 }),
                        ],
                        spacing: { after: 40 },
                    })
                );
            }
        });
    }

    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
        sections.push(createSectionHeading("Skills"));
        resumeData.skills.forEach((skillGroup) => {
            sections.push(createBullet(` ${skillGroup.items}`, `${skillGroup.category}:`));
        });
    }

    // Projects / Experience
    if (resumeData.projects && resumeData.projects.length > 0) {
        sections.push(createSectionHeading("Projects"));
        resumeData.projects.forEach((proj) => {
            const headingChildren = [new TextRun({ text: proj.title, font: "Times New Roman", size: 22, bold: true })];
            if (proj.url) {
                headingChildren.push(new TextRun({ text: `  (${proj.url})`, font: "Times New Roman", size: 20, italics: true }));
            }
            sections.push(
                new Paragraph({
                    children: headingChildren,
                    spacing: { before: 100, after: 40 },
                })
            );
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: proj.description, font: "Times New Roman", size: 20 }),
                    ],
                    spacing: { after: 40 },
                })
            );
        });
    }

    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
        sections.push(createSectionHeading("Experience"));
        resumeData.experience.forEach((exp) => {
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: exp.role + " ", font: "Times New Roman", size: 22, bold: true }),
                        new Tab(),
                        new TextRun({ text: `${exp.dates || ""}`, font: "Times New Roman", size: 20 }),
                    ],
                    tabStops: [{ type: TabStopType.RIGHT, position: 10080 }],
                    spacing: { before: 100, after: 40 },
                })
            );
            sections.push(
                new Paragraph({
                    children: [
                        new TextRun({ text: exp.company, font: "Times New Roman", size: 20, italics: true }),
                    ],
                    spacing: { after: 40 },
                })
            );
            if (exp.bullets) {
                exp.bullets.forEach((b) => {
                    sections.push(createBullet(b));
                });
            } else if (exp.description) {
                sections.push(
                    new Paragraph({
                        children: [new TextRun({ text: exp.description, font: "Times New Roman", size: 20 })],
                        spacing: { after: 40 },
                    })
                );
            }
        });
    }

    // Certifications
    if (resumeData.certifications && resumeData.certifications.length > 0) {
        sections.push(createSectionHeading("Certifications"));
        resumeData.certifications.forEach((cert) => {
            sections.push(createBullet(cert));
        });
    }

    // Achievements
    if (resumeData.achievements && resumeData.achievements.length > 0) {
        sections.push(createSectionHeading("Achievements"));
        resumeData.achievements.forEach((ach) => {
            sections.push(createBullet(ach));
        });
    }

    // Create document
    const doc = new Document({
        sections: [
            {
                properties: {
                    page: {
                        margin: {
                            top: 720,
                            right: 720,
                            bottom: 720,
                            left: 720,
                        },
                    },
                },
                children: sections,
            },
        ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
}

module.exports = { generateResumeDocx };
