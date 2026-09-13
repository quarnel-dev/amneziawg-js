import { execFile, spawn } from 'node:child_process'
import { promisify } from 'node:util'

export const execFileAsync = promisify(execFile)

export function execWithInput(command: string, args: string[], input: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args)
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk
    })

    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
      } else {
        reject(new Error(`${command} exited with code ${code}: ${stderr}`))
      }
    })

    child.stdin.write(input)
    child.stdin.end()
  })
}
