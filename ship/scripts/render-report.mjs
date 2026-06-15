#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const skillRoot = path.resolve(scriptDir, '..')

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    if (!key.startsWith('--')) {
      throw new Error(`Unexpected argument: ${key}`)
    }
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${key}`)
    }
    args[key.slice(2)] = value
    i += 1
  }
  for (const key of ['data', 'html', 'pr-body']) {
    if (!args[key]) {
      throw new Error(`Missing required --${key}`)
    }
  }
  return args
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    throw new Error(`Failed to read JSON ${filePath}: ${error.message}`)
  }
}

function jsType(value) {
  if (Array.isArray(value)) return 'array'
  if (value === null) return 'null'
  if (Number.isInteger(value)) return 'integer'
  return typeof value
}

function allowsType(schemaType, actual) {
  const types = Array.isArray(schemaType) ? schemaType : [schemaType]
  if (types.includes(actual)) return true
  return actual === 'integer' && types.includes('number')
}

function validate(schema, value, location = '$') {
  const errors = []
  if (schema.type && !allowsType(schema.type, jsType(value))) {
    return [
      `${location} must be ${Array.isArray(schema.type) ? schema.type.join(' or ') : schema.type}; got ${jsType(value)}`,
    ]
  }
  if (schema.enum && !schema.enum.includes(value)) {
    errors.push(`${location} must be one of: ${schema.enum.join(', ')}`)
  }
  if (typeof value === 'string' && schema.minLength && value.length < schema.minLength) {
    errors.push(`${location} must be at least ${schema.minLength} character(s)`)
  }
  if (
    (typeof value === 'number' || Number.isInteger(value)) &&
    schema.minimum !== undefined &&
    value < schema.minimum
  ) {
    errors.push(`${location} must be >= ${schema.minimum}`)
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${location} must contain at least ${schema.minItems} item(s)`)
    }
    if (schema.items) {
      value.forEach((item, index) => {
        errors.push(...validate(schema.items, item, `${location}[${index}]`))
      })
    }
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const required = schema.required || []
    for (const key of required) {
      if (!(key in value)) errors.push(`${location}.${key} is required`)
    }
    const properties = schema.properties || {}
    for (const [key, child] of Object.entries(properties)) {
      if (key in value) errors.push(...validate(child, value[key], `${location}.${key}`))
    }
    if (schema.additionalProperties === false) {
      for (const key of Object.keys(value)) {
        if (!(key in properties)) errors.push(`${location}.${key} is not allowed`)
      }
    }
  }
  return errors
}

function validateWorkflowRules(data) {
  const errors = []
  const qa = data.selfQa
  if (qa.videoRequired && qa.mode !== 'video' && !qa.fallbackApprovedByUser) {
    errors.push('$.selfQa requires video mode unless fallbackApprovedByUser is true')
  }
  if (qa.tsxChanged && !qa.videoRequired) {
    errors.push('$.selfQa.videoRequired must be true when tsxChanged is true')
  }
  if (qa.mode === 'video' && !qa.artifactPath.endsWith('.webm')) {
    errors.push('$.selfQa.artifactPath should point to a .webm file in video mode')
  }
  if (qa.mode === 'fallback' && !qa.artifactPath.endsWith('.md')) {
    errors.push('$.selfQa.artifactPath should point to a .md file in fallback mode')
  }
  if (data.adversarialReview.critical !== 0 || data.adversarialReview.major !== 0) {
    errors.push('$.adversarialReview critical and major remaining counts must both be 0')
  }
  if (data.qualityGates.some((gate) => gate.status === 'failed')) {
    errors.push('$.qualityGates contains a failed gate')
  }
  if (data.acceptanceCriteria.some((item) => item.status === 'blocked')) {
    errors.push('$.acceptanceCriteria contains a blocked criterion')
  }
  if (!data.decisions.filePath.endsWith('/DECISIONS.md')) {
    errors.push('$.decisions.filePath must point to .reports/<artifact-id>/DECISIONS.md')
  }
  if (data.lessons.filePath !== 'LESSONS.md') {
    errors.push('$.lessons.filePath must be LESSONS.md')
  }
  return errors
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function mdEscape(value) {
  return String(value).replaceAll('\r\n', '\n')
}

function isExternalLink(value) {
  return /^[a-z][a-z\d+.-]*:|^\/\//i.test(value) || value.startsWith('#')
}

function toHtmlRelativeAssetPath(assetPath, htmlOutputPath) {
  if (isExternalLink(assetPath) || path.isAbsolute(assetPath)) {
    return assetPath
  }
  if (assetPath.startsWith('./') || assetPath.startsWith('../')) {
    return assetPath
  }

  const htmlDir = path.dirname(path.resolve(htmlOutputPath))
  const assetAbsolutePath = path.resolve(assetPath)
  let relativePath = path.relative(htmlDir, assetAbsolutePath).replaceAll(path.sep, '/')

  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`
  }

  return relativePath
}

function li(items) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n')
}

function mdList(items) {
  return items.map((item) => `- ${mdEscape(item)}`).join('\n')
}

function mdTableCell(value) {
  return mdEscape(value).replaceAll('|', '\\|').replaceAll('\n', '<br>')
}

function mdChecklist(checked, text) {
  return `- [${checked ? 'x' : ' '}] ${text}`
}

function statusClass(status) {
  return escapeHtml(status.replaceAll('_', '-'))
}

function renderFileTour(files) {
  return files
    .map((file) => {
      const additions = file.additions > 0 ? `<span class="add">+${file.additions}</span>` : ''
      const deletions = file.deletions > 0 ? `<span class="del">-${file.deletions}</span>` : ''
      const snippet = file.snippet.trim()
        ? `\n    <div class="code"><pre>${escapeHtml(file.snippet)}</pre></div>`
        : ''
      return `<details class="file"${file.open ? ' open' : ''}>
  <summary>
    <span class="chev"></span>
    <span class="path">${escapeHtml(file.path)}</span>
    <span class="badge ${escapeHtml(file.changeType)}">${escapeHtml(file.changeType)}</span>
    <span class="stat">${additions} ${deletions}</span>
  </summary>
  <div class="file-body">
    <p>${escapeHtml(file.explanation)}</p>${snippet}
  </div>
</details>`
    })
    .join('\n')
}

function renderFocus(items) {
  return items
    .map(
      (item, index) => `<div class="focus-item">
  <div class="num">${index + 1}</div>
  <div>
    <div class="item-title">${escapeHtml(item.title)}</div>
    <div class="note"><code>${escapeHtml(item.location)}</code> ${escapeHtml(item.rationale)}</div>
  </div>
</div>`
    )
    .join('\n')
}

function renderRows(items, kind) {
  return items
    .map((item) => {
      const title = item.label || item.name || item.criterion
      const detail = item.command
        ? `Command: ${item.command}. ${item.evidence}`
        : item.evidence || item.status
      const status = item.status
      return `<div class="${kind}">
  <div class="row-head">
    <div>
      <div class="item-title">${escapeHtml(title)}</div>
      <div class="note">${escapeHtml(detail)}</div>
    </div>
    <span class="status ${statusClass(status)}">${escapeHtml(status)}</span>
  </div>
</div>`
    })
    .join('\n')
}

function renderSelfQa(qa, options) {
  const artifactPath = options?.htmlOutputPath
    ? toHtmlRelativeAssetPath(qa.artifactPath, options.htmlOutputPath)
    : qa.artifactPath
  const scenarios = `<ul class="clean">${li(qa.scenarios)}</ul>`
  if (qa.mode === 'video') {
    return `<div class="qa">
  <div class="row-head">
    <div>
      <div class="item-title">${escapeHtml(qa.caption)}</div>
      <div class="note">${escapeHtml(qa.videoRequiredReason)}</div>
    </div>
    <span class="status done">video</span>
  </div>
  <video controls preload="metadata" src="${escapeHtml(artifactPath)}"></video>
  <h3>Scenarios covered</h3>
  ${scenarios}
</div>`
  }
  return `<div class="qa">
  <div class="row-head">
    <div>
      <div class="item-title">${escapeHtml(qa.caption)}</div>
      <div class="note">${escapeHtml(qa.videoRequiredReason)}</div>
    </div>
    <span class="status pending">fallback</span>
  </div>
  <p><a href="${escapeHtml(artifactPath)}">Open QA fallback evidence</a></p>
  <h3>Scenarios covered</h3>
  ${scenarios}
</div>`
}

function renderAdversarial(review) {
  const findings = review.findings.length ? li(review.findings) : '<li>No remaining findings.</li>'
  return `<div class="adversarial">
  <div class="item-title">Remaining critical and major findings are resolved.</div>
  <div class="adversarial-grid">
    <div class="metric"><div class="k">Iterations</div><div class="v">${review.iterations}</div></div>
    <div class="metric"><div class="k">Critical / Major</div><div class="v">${review.critical} / ${review.major}</div></div>
    <div class="metric"><div class="k">Minor</div><div class="v">${review.minor}</div></div>
    <div class="metric"><div class="k">Nitpick</div><div class="v">${review.nitpick}</div></div>
  </div>
  <ul class="clean">${findings}</ul>
</div>`
}

function renderDecisions(decisions) {
  const items = decisions.items
    .map(
      (item) => `<details class="decision" open>
  <summary>
    <span class="path">${escapeHtml(item.title)}</span>
    <span class="status done">${escapeHtml(item.recordedAt)}</span>
  </summary>
  <div class="decision-body">
    <p><strong>Context:</strong> ${escapeHtml(item.context)}</p>
    <p><strong>Chosen path:</strong> ${escapeHtml(item.chosenPath)}</p>
    <p><strong>Rationale:</strong> ${escapeHtml(item.rationale)}</p>
    <p><strong>Tradeoffs and risks:</strong> ${escapeHtml(item.tradeoffs)}</p>
    <p><strong>Evidence:</strong> ${escapeHtml(item.evidence)}</p>
    <h3>Options considered</h3>
    <ul class="clean">${li(item.optionsConsidered)}</ul>
    <h3>Affected files</h3>
    <ul class="clean">${li(item.affectedFiles)}</ul>
  </div>
</details>`
    )
    .join('\n')
  return `<p class="lede">Recorded in <code>${escapeHtml(decisions.filePath)}</code>.</p><div class="decisions">${items}</div>`
}

function renderLessons(lessons) {
  const items = lessons.items
    .map(
      (item) => `<div class="lesson">
  <div class="row-head">
    <div>
      <div class="item-title">${escapeHtml(item.source)} - ${escapeHtml(item.area)} - ${escapeHtml(item.lesson)}</div>
      <div class="note"><strong>Applies when:</strong> ${escapeHtml(item.appliesWhen)}</div>
      <div class="note"><strong>Next time:</strong> ${escapeHtml(item.nextTime)}</div>
      <div class="note"><strong>Evidence:</strong> ${escapeHtml(item.evidence)}</div>
      <div class="note"><strong>Files:</strong> ${escapeHtml(item.files.join(', '))}</div>
    </div>
    <span class="status done">${escapeHtml(item.date)}</span>
  </div>
</div>`
    )
    .join('\n')
  return `<p class="lede">Recorded in <code>${escapeHtml(lessons.filePath)}</code>.</p><div class="lessons">${items}</div>`
}

function renderDependencies(dependencies) {
  return dependencies
    .map(
      (item) => `<div class="dep">
  <div class="item-title">${escapeHtml(item.name)}</div>
  <div class="note">${escapeHtml(item.status)}</div>
</div>`
    )
    .join('\n')
}

function renderRollout(rollout) {
  const steps = rollout.steps
    .map(
      (step) => `<div class="rollout-step">
  <div class="when">${escapeHtml(step.when)}</div>
  <div class="label">${escapeHtml(step.label)}</div>
  <div class="note">${escapeHtml(step.details)}</div>
</div>`
    )
    .join('\n')
  return `<p class="lede">${escapeHtml(rollout.summary)}</p><div class="rollout">${steps}</div>`
}

function renderCommit(commit) {
  return `<div class="commit">
  <div><strong>${escapeHtml(commit.shortSha)}</strong> <code>${escapeHtml(commit.sha)}</code></div>
  <pre>${escapeHtml(commit.message)}</pre>
</div>`
}

function renderHtml(template, data, options = {}) {
  const meta = data.meta
  const vars = {
    PAGE_TITLE: `${meta.workId} - ${meta.title}`,
    EYEBROW: `${meta.contextLabel} - ${meta.contextId}`,
    HEADING: `${meta.workId} - ${meta.title}`,
    META_ITEMS: [
      `<span><strong>${data.stats.fileCount}</strong> files</span>`,
      `<span><span class="add">+${data.stats.additions}</span> / <span class="del">-${data.stats.deletions}</span></span>`,
      `<span>branch <strong>${escapeHtml(meta.branch)}</strong> &rarr; <strong>${escapeHtml(meta.baseBranch)}</strong></span>`,
      `<span>author <strong>${escapeHtml(meta.author)}</strong></span>`,
      meta.prUrl ? `<span><a href="${escapeHtml(meta.prUrl)}">Pull request</a></span>` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    PROMPT: escapeHtml(data.prompt),
    TLDR: escapeHtml(data.tldr),
    WHY_PARAGRAPHS: data.why.motivation
      .map((text) => `<p class="lede">${escapeHtml(text)}</p>`)
      .join('\n'),
    BEFORE_ITEMS: li(data.why.before),
    AFTER_ITEMS: li(data.why.after),
    FILE_TOUR: renderFileTour(data.fileTour),
    REVIEW_FOCUS: renderFocus(data.reviewFocus),
    TEST_PLAN: renderRows(data.testPlan, 'test'),
    QUALITY_GATES: renderRows(data.qualityGates, 'gate'),
    SELF_QA: renderSelfQa(data.selfQa, { htmlOutputPath: options.htmlOutputPath }),
    ACCEPTANCE: renderRows(data.acceptanceCriteria, 'check'),
    ADVERSARIAL: renderAdversarial(data.adversarialReview),
    DECISIONS: renderDecisions(data.decisions),
    LESSONS: renderLessons(data.lessons),
    DEPENDENCIES: renderDependencies(data.dependencies),
    ROLLOUT: renderRollout(data.rollout),
    COMMIT: renderCommit(data.commit),
    TOC_FILES: data.fileTour
      .slice(0, 4)
      .map((file) => `<a href="#tour" class="sub">${escapeHtml(path.basename(file.path))}</a>`)
      .join('\n'),
  }
  return applyTemplate(template, vars)
}

function renderPrBody(template, data) {
  const reportPath = `.reports/${data.meta.artifactId}/${data.meta.artifactId}.html`
  const qaPath = data.selfQa.artifactPath
  const vars = {
    TLDR: mdEscape(data.tldr),
    CHANGE_SUMMARY: mdList(data.why.after),
    WHY: data.why.motivation.map(mdEscape).join('\n\n'),
    BEFORE: mdList(data.why.before),
    AFTER: mdList(data.why.after),
    FILE_TOUR: data.fileTour
      .map((file) => {
        const stat = [`+${file.additions}`, `-${file.deletions}`].join(' / ')
        const snippet = file.snippet.trim()
          ? `\n\n\`\`\`${file.snippetLanguage}\n${file.snippet}\n\`\`\``
          : ''
        return `### ${file.path}\n\n${file.changeType} ${stat}\n\n${file.explanation}${snippet}`
      })
      .join('\n\n'),
    REVIEW_FOCUS: data.reviewFocus
      .map(
        (item, index) => `${index + 1}. **${item.title}** - \`${item.location}\`: ${item.rationale}`
      )
      .join('\n'),
    CHECKED_SUMMARY: [
      mdChecklist(
        !data.qualityGates.some((gate) => gate.status === 'failed'),
        `Quality gates: ${data.qualityGates.map((gate) => `${gate.name} ${gate.status}`).join(', ')}`
      ),
      mdChecklist(
        data.testPlan.every((item) => item.status !== 'pending'),
        `Test plan: ${data.testPlan.map((item) => `${item.label} ${item.status}`).join(', ')}`
      ),
      mdChecklist(
        data.selfQa.mode === 'video' || data.selfQa.mode === 'fallback',
        `Self-QA: ${data.selfQa.caption}`
      ),
      mdChecklist(
        data.adversarialReview.critical === 0 && data.adversarialReview.major === 0,
        `Adversarial review: ${data.adversarialReview.critical} critical and ${data.adversarialReview.major} major findings remaining`
      ),
    ].join('\n'),
    TEST_PLAN: data.testPlan
      .map((item) =>
        mdChecklist(
          item.status === 'done',
          `**${item.kind}:** ${item.label} - ${item.status}. ${item.evidence}`
        )
      )
      .join('\n'),
    QUALITY_GATES: data.qualityGates
      .map((gate) =>
        mdChecklist(
          gate.status === 'passed',
          `**${gate.name}:** \`${gate.command}\` - ${gate.status}. ${gate.evidence}`
        )
      )
      .join('\n'),
    SELF_QA:
      data.selfQa.mode === 'video'
        ? `<video src="${data.selfQa.artifactPath}" controls></video>\n\n[Download QA recording](${data.selfQa.artifactPath})\n\n${data.selfQa.caption}\n\n${mdList(data.selfQa.scenarios)}`
        : `See [QA fallback evidence](${data.selfQa.artifactPath}).\n\n${data.selfQa.caption}\n\n${mdList(data.selfQa.scenarios)}`,
    ACCEPTANCE_CRITERIA: data.acceptanceCriteria
      .map(
        (item) =>
          `- [${item.status === 'satisfied' ? 'x' : ' '}] ${item.criterion} - ${item.evidence}`
      )
      .join('\n'),
    ADVERSARIAL_REVIEW: `Iterations: ${data.adversarialReview.iterations}\n\nRemaining critical/major: ${data.adversarialReview.critical}/${data.adversarialReview.major}\n\nRemaining minor/nitpick: ${data.adversarialReview.minor}/${data.adversarialReview.nitpick}\n\n${mdList(data.adversarialReview.findings.length ? data.adversarialReview.findings : ['No remaining findings.'])}`,
    DECISIONS: `Recorded in \`${data.decisions.filePath}\`.\n\n${data.decisions.items.map((item, index) => `${index + 1}. **${item.title}** (${item.recordedAt})\n\nContext: ${item.context}\n\nOptions considered:\n${mdList(item.optionsConsidered)}\n\nChosen path: ${item.chosenPath}\n\nRationale: ${item.rationale}\n\nTradeoffs and risks: ${item.tradeoffs}\n\nEvidence: ${item.evidence}\n\nAffected files:\n${mdList(item.affectedFiles)}`).join('\n\n')}`,
    LESSONS: `Recorded in \`${data.lessons.filePath}\`.\n\n| Source | Area | Lesson | Applies when | Evidence | Next time | Files |\n|---|---|---|---|---|---|---|\n${data.lessons.items.map((item) => `| ${mdTableCell(item.source)} | ${mdTableCell(item.area)} | ${mdTableCell(item.lesson)} | ${mdTableCell(item.appliesWhen)} | ${mdTableCell(item.evidence)} | ${mdTableCell(item.nextTime)} | ${mdTableCell(item.files.join(', '))} |`).join('\n')}`,
    DEPENDENCIES: data.dependencies.map((item) => `- **${item.name}:** ${item.status}`).join('\n'),
    ROLLOUT: `${data.rollout.summary}\n\n${data.rollout.steps.map((step) => `- **${step.when} - ${step.label}:** ${step.details}`).join('\n')}`,
    ARTIFACTS: [
      `- HTML report: \`${reportPath}\``,
      `- Decisions log: \`${data.decisions.filePath}\``,
      `- Lessons log: \`${data.lessons.filePath}\``,
      `- QA artifact: \`${qaPath}\``,
      data.meta.prUrl ? `- Pull request: ${data.meta.prUrl}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    COMMIT: data.commit.message,
  }
  return applyTemplate(template, vars)
}

function applyTemplate(template, vars) {
  let output = template
  for (const [key, value] of Object.entries(vars)) {
    output = output.replaceAll(`{{${key}}}`, String(value))
    output = output.replaceAll(`%%${key}%%`, String(value))
  }
  const leftovers = output.match(/\{\{[A-Z0-9_ -]+\}\}|%%[A-Z0-9_ -]+%%/g)
  if (leftovers) {
    throw new Error(`Unresolved template placeholders: ${[...new Set(leftovers)].join(', ')}`)
  }
  return output
}

function ensureParent(filePath) {
  fs.mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true })
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const schemaPath = args.schema || path.join(skillRoot, 'templates', 'report-data.schema.json')
  const htmlTemplatePath = args['html-template'] || path.join(skillRoot, 'templates', 'report.html')
  const prTemplatePath = args['pr-template'] || path.join(skillRoot, 'templates', 'pr-body.md')
  const schema = readJson(schemaPath)
  const data = readJson(args.data)
  const schemaErrors = validate(schema, data)
  const workflowErrors = schemaErrors.length ? [] : validateWorkflowRules(data)
  const errors = [...schemaErrors, ...workflowErrors]
  if (errors.length) {
    throw new Error(`Report data validation failed:\n- ${errors.join('\n- ')}`)
  }
  const html = renderHtml(fs.readFileSync(htmlTemplatePath, 'utf8'), data, {
    htmlOutputPath: args.html,
  })
  const prBody = renderPrBody(fs.readFileSync(prTemplatePath, 'utf8'), data)
  ensureParent(args.html)
  ensureParent(args['pr-body'])
  fs.writeFileSync(args.html, html)
  fs.writeFileSync(args['pr-body'], prBody)
  console.log(`Rendered ${args.html}`)
  console.log(`Rendered ${args['pr-body']}`)
}

try {
  main()
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
