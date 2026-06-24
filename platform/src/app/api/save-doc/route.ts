import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const docsDir = path.resolve('/Users/ravipatichinnaranga/.gemini/antigravity-ide/scratch/farfindarole-learn/docs')

export async function GET() {
  try {
    if (!fs.existsSync(docsDir)) {
      return NextResponse.json({ success: true, documents: [] })
    }
    const files = fs.readdirSync(docsDir)
    const documents = files
      .filter(f => f.endsWith('.md'))
      .map(f => {
        const filePath = path.join(docsDir, f)
        const stats = fs.statSync(filePath)
        const content = fs.readFileSync(filePath, 'utf8')
        return {
          filename: f,
          content: content,
          updatedAt: stats.mtime.toISOString(),
          size: stats.size
        }
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

    return NextResponse.json({ success: true, documents })
  } catch (error: any) {
    console.error('Error listing documents:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { filename, content } = body

    if (!filename || !content) {
      return NextResponse.json(
        { error: 'Filename and content are required' },
        { status: 400 }
      )
    }

    const safeFilename = filename
      .replace(/\.\./g, '')
      .replace(/[^\w\-\.\/]/g, '_')

    const targetFilePath = path.join(docsDir, safeFilename)

    if (!targetFilePath.startsWith(docsDir)) {
      return NextResponse.json(
        { error: 'Access denied: Directory traversal detected' },
        { status: 403 }
      )
    }

    const fileDir = path.dirname(targetFilePath)
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true })
    }

    fs.writeFileSync(targetFilePath, content, 'utf8')

    return NextResponse.json({
      success: true,
      message: `File saved successfully to docs/${safeFilename}`,
      path: targetFilePath
    })
  } catch (error: any) {
    console.error('Error saving document:', error)
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const filename = searchParams.get('filename')
    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 })
    }

    const safeFilename = filename
      .replace(/\.\./g, '')
      .replace(/[^\w\-\.\/]/g, '_')

    const targetFilePath = path.join(docsDir, safeFilename)

    if (!targetFilePath.startsWith(docsDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (fs.existsSync(targetFilePath)) {
      fs.unlinkSync(targetFilePath)
    }

    return NextResponse.json({ success: true, message: 'Document deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
