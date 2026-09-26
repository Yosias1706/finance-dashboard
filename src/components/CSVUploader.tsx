import { useCallback, useId, useRef, useState } from 'react'
import { FileSpreadsheet, Loader2, Sparkles, Trash2, UploadCloud } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { parseCSV } from '@/utils/csvParser'
import { useFinanceStore } from '@/store/useFinanceStore'

type Status = 'idle' | 'parsing'

function isCsv(file: File): boolean {
  return file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv'
}

export function CSVUploader() {
  const inputId = useId()
  /** Nested elements fire dragleave on entry, so depth-count instead of a boolean. */
  const dragDepth = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const setTransactions = useFinanceStore((state) => state.setTransactions)
  const loadSampleData = useFinanceStore((state) => state.loadSampleData)
  const clearTransactions = useFinanceStore((state) => state.clearTransactions)
  const hasTransactions = useFinanceStore((state) => state.transactions.length > 0)

  const ingest = useCallback(
    async (file: File | undefined) => {
      if (!file) return

      setError(null)
      setNotice(null)

      if (!isCsv(file)) {
        setError(`"${file.name}" is not a CSV file.`)
        return
      }

      setStatus('parsing')
      try {
        const transactions = await parseCSV(file)
        setTransactions(transactions)
        setNotice(`Imported ${transactions.length} transactions from ${file.name}.`)
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'Could not read that CSV file.')
      } finally {
        setStatus('idle')
      }
    },
    [setTransactions],
  )

  const handleDragEnter = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    dragDepth.current += 1
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    dragDepth.current -= 1
    if (dragDepth.current <= 0) {
      dragDepth.current = 0
      setIsDragging(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    dragDepth.current = 0
    setIsDragging(false)
    void ingest(event.dataTransfer.files[0])
  }

  const isParsing = status === 'parsing'

  return (
    <Card>
      <CardContent className="flex flex-col gap-4">
        <label
          htmlFor={inputId}
          onDragEnter={handleDragEnter}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center transition-colors',
            'hover:border-ring/60 hover:bg-muted/40',
            'has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50',
            isDragging && 'border-ring bg-muted/60',
            isParsing && 'pointer-events-none opacity-60',
          )}
        >
          <input
            id={inputId}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            disabled={isParsing}
            onChange={(event) => {
              void ingest(event.target.files?.[0])
              event.target.value = ''
            }}
          />

          {isParsing ? (
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <UploadCloud
              className={cn(
                'size-6 transition-colors',
                isDragging ? 'text-foreground' : 'text-muted-foreground',
              )}
              aria-hidden
            />
          )}

          <span className="text-sm font-medium text-foreground">
            {isParsing ? 'Reading your statement…' : 'Drop a CSV statement here'}
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-3.5" aria-hidden />
            Needs Date, Description and Amount columns — or click to browse
          </span>
        </label>

        {error !== null && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {error === null && notice !== null && (
          <p role="status" className="text-sm text-muted-foreground">
            {notice}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={isParsing}
            onClick={() => {
              setError(null)
              loadSampleData()
              setNotice('Loaded three months of sample transactions.')
            }}
          >
            <Sparkles aria-hidden />
            Load Sample Data
          </Button>

          {hasTransactions && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isParsing}
              onClick={() => {
                clearTransactions()
                setError(null)
                setNotice(null)
              }}
            >
              <Trash2 aria-hidden />
              Clear all
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
