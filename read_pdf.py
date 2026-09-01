
import Quartz
from CoreFoundation import CFURLCreateFromFileSystemRepresentation, kCFAllocatorDefault
import os

url = CFURLCreateFromFileSystemRepresentation(kCFAllocatorDefault, b'HealthAI_Terms_and_Conditions.md.pdf', len(b'HealthAI_Terms_and_Conditions.md.pdf'), False)
pdf = Quartz.PDFDocument.alloc().initWithURL_(url)
text = []
for i in range(pdf.pageCount()):
    page = pdf.pageAtIndex_(i)
    text.append(f'=== PAGE {i+1} ===
' + page.string())
print('
'.join(text))
