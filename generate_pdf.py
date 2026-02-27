#!/usr/bin/env python3
"""
Generate PDF from PROJECT_TREE.txt
Uses reportlab library to create a professional PDF document
"""

from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Preformatted
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from datetime import datetime
import os

# Read the project tree file
with open('PROJECT_TREE.txt', 'r', encoding='utf-8') as f:
    content = f.read()

# Create PDF
pdf_filename = 'Crownshift_Logistics_Project_Tree.pdf'
doc = SimpleDocTemplate(pdf_filename, pagesize=letter,
                       rightMargin=0.5*inch, leftMargin=0.5*inch,
                       topMargin=0.75*inch, bottomMargin=0.75*inch)

# Container for elements
story = []

# Styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#1a1a1a'),
    spaceAfter=6,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=12,
    textColor=colors.HexColor('#2c3e50'),
    spaceAfter=4,
    fontName='Helvetica-Bold',
    borderColor=colors.HexColor('#e0e0e0'),
    borderWidth=1,
    borderPadding=4
)

normal_style = ParagraphStyle(
    'Normal',
    parent=styles['Normal'],
    fontSize=9,
    fontName='Courier',
    leftIndent=0
)

# Add title
story.append(Paragraph('CROWNSHIFT LOGISTICS', title_style))
story.append(Paragraph('Project Directory Structure & Documentation', styles['Heading3']))
story.append(Spacer(1, 0.1*inch))

# Add date
story.append(Paragraph(f'<i>Generated: {datetime.now().strftime("%B %d, %Y")}</i>', styles['Normal']))
story.append(Spacer(1, 0.15*inch))

# Split content into sections and add them
sections = content.split('\n================================================================================\n')

for section in sections:
    lines = section.strip().split('\n')
    
    for i, line in enumerate(lines):
        if len(line) > 110:
            # Use smaller font for very long lines
            story.append(Preformatted(line, styles['Normal']))
        elif line.startswith('├─') or line.startswith('│') or line.startswith('└─') or line.startswith('   '):
            # Tree structure lines - use monospace
            story.append(Preformatted(line, normal_style))
        elif line.startswith('•') or line.startswith('✓') or line.startswith('✗') or line.startswith('✨'):
            # List items
            story.append(Paragraph(line, styles['Normal']))
        elif any(line.startswith(ch) for ch in ['├', '│', '└', '─', '.']):
            # Tree structure
            story.append(Preformatted(line, normal_style))
        elif line.strip() and ':' in line and len(line) < 70:
            # Headers with content
            story.append(Paragraph('<b>' + line + '</b>', styles['Normal']))
        elif line.strip():
            # Regular text
            story.append(Paragraph(line, styles['Normal']))
        else:
            # Blank line
            story.append(Spacer(1, 0.05*inch))

# Add footer with page numbers
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._saved_state = None

    def showPage(self):
        self.setFont("Helvetica", 8)
        self.drawRightString(7.5*inch, 0.5*inch,
                            f"Page {self._pageNumber}")
        self.drawString(0.5*inch, 0.5*inch,
                       "Crownshift Logistics Project Tree")
        canvas.Canvas.showPage(self)

# Build PDF
doc.build(story, canvasmaker=NumberedCanvas)

print(f'✅ PDF Generated: {pdf_filename}')
print(f'📄 Location: {os.path.abspath(pdf_filename)}')
print(f'📊 File size: {os.path.getsize(pdf_filename) / 1024:.1f} KB')
