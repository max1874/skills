// Lays screenshots out in one labelled grid, so a before/after or a set of candidates
// can be compared in a single image.
//
//   swift scripts/compare.swift out.png --cols "Now,Option A,Option B" --rows "Light,Dark" a1.png b1.png c1.png a2.png b2.png c2.png
//
// Images are row-major and must number cols × rows (--rows is optional; without it there is one row).
// Each image is scaled to the first image's height. Output is PNG.
import AppKit

var args = Array(CommandLine.arguments.dropFirst())
func option(_ name: String) -> [String] {
    guard let i = args.firstIndex(of: name), i + 1 < args.count else { return [] }
    let value = args[i + 1]
    args.removeSubrange(i...(i + 1))
    return value.split(separator: ",").map { $0.trimmingCharacters(in: .whitespaces) }
}
let cols = option("--cols")
let rows = option("--rows")
guard args.count >= 2, !cols.isEmpty else {
    FileHandle.standardError.write("usage: compare.swift out.png --cols A,B[,…] [--rows X,Y] images…\n".data(using: .utf8)!)
    exit(2)
}
let out = args.removeFirst()
let rowCount = max(rows.count, 1)
guard args.count == cols.count * rowCount else {
    FileHandle.standardError.write("need \(cols.count * rowCount) images, got \(args.count)\n".data(using: .utf8)!)
    exit(2)
}
let images: [CGImage] = args.map { path in
    guard let image = NSImage(contentsOfFile: path)?.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        FileHandle.standardError.write("cannot read \(path)\n".data(using: .utf8)!)
        exit(1)
    }
    return image
}

let cellHeight = CGFloat(images[0].height)
let cellWidth = images.map { CGFloat($0.width) * cellHeight / CGFloat($0.height) }.max()!
let gap: CGFloat = 40
// Sized from the width so labels stay readable on short crops too.
let font = NSFont.systemFont(ofSize: cellWidth / 16, weight: .semibold)
let header = font.pointSize * 2.4
let side: CGFloat = rows.isEmpty ? 0 : font.pointSize * 5
let width = side + CGFloat(cols.count) * cellWidth + CGFloat(cols.count + 1) * gap
let height = header + CGFloat(rowCount) * cellHeight + CGFloat(rowCount + 1) * gap

let context = CGContext(data: nil, width: Int(width), height: Int(height), bitsPerComponent: 8, bytesPerRow: 0,
                        space: CGColorSpace(name: CGColorSpace.sRGB)!, bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
// A mid grey, so both light and dark screenshots keep their edges.
context.setFillColor(CGColor(gray: 0.55, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
NSGraphicsContext.current = NSGraphicsContext(cgContext: context, flipped: false)

func label(_ text: String, centeredAt point: CGPoint) {
    let attributed = NSAttributedString(string: text, attributes: [.font: font, .foregroundColor: NSColor.white])
    let size = attributed.size()
    attributed.draw(at: CGPoint(x: point.x - size.width / 2, y: point.y - size.height / 2))
}

for (c, title) in cols.enumerated() {
    label(title, centeredAt: CGPoint(x: side + gap + CGFloat(c) * (cellWidth + gap) + cellWidth / 2, y: height - header / 2 - gap / 2))
}
for r in 0..<rowCount {
    let top = height - header - gap - CGFloat(r) * (cellHeight + gap)
    if !rows.isEmpty { label(rows[r], centeredAt: CGPoint(x: side / 2 + gap / 2, y: top - cellHeight / 2)) }
    for c in 0..<cols.count {
        let image = images[r * cols.count + c]
        let w = CGFloat(image.width) * cellHeight / CGFloat(image.height)
        let x = side + gap + CGFloat(c) * (cellWidth + gap) + (cellWidth - w) / 2
        context.draw(image, in: CGRect(x: x, y: top - cellHeight, width: w, height: cellHeight))
    }
}

let rep = NSBitmapImageRep(cgImage: context.makeImage()!)
try! rep.representation(using: .png, properties: [:])!.write(to: URL(fileURLWithPath: out))
print(out)
