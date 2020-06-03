/* global Mocha */
const {
  EVENT_RUN_END,
  EVENT_TEST_BEGIN,
  EVENT_TEST_FAIL,
  EVENT_TEST_PASS,
  EVENT_SUITE_BEGIN
} = Mocha.Runner.constants

export function createWebdriverAndHtmlReporter(html_reporter) {
  return function(runner) {
    Mocha.reporters.Base.call(this, runner)

    // report on the selenium screen, too
    // fucking eslint forced me to create this prop
    runner.html = new html_reporter(runner)

    // build a summary
    const summary = []

    let mocha = document.querySelector('#mocha')
    runner.on(EVENT_TEST_BEGIN, test => {
      console.log('\n### ' + test.title + ' ###\n')
      // Scroll down test display after each test
      mocha.scrollTop = mocha.scrollHeight
    })

    runner.on(EVENT_SUITE_BEGIN, suite => {
      if (suite.root) return
      console.log('\n## ' + suite.title + ' ## \n')
      summary.push('## ' + suite.title)
    })

    runner.on(EVENT_TEST_FAIL, test => {
      console.log('->', 'FAILED :', test.title, stringifyException(test.err))
      summary.push(Mocha.reporters.Base.symbols.err + ' ' + test.title)
    })
    runner.on(EVENT_TEST_PASS, test => {
      const status = `${test.title} (${test.duration / 1000}s)`
      console.log('->', 'PASSED :', status)
      summary.push(Mocha.reporters.Base.symbols.ok + ' ' + status)
    })

    runner.on(EVENT_RUN_END, () => {
      const minutes = Math.floor(runner.stats.duration / 1000 / 60)
      const seconds = Math.round((runner.stats.duration / 1000) % 60)

      console.log('\n' + summary.join('\n'))

      console.log(
        'FINISHED ' + (runner.stats.failures > 0 ? 'FAILED' : 'PASSED') + ' -',
        runner.stats.passes,
        'tests passed,',
        runner.stats.failures,
        'tests failed, duration: ' + minutes + ':' + seconds
      )
    })
  }
}

function stringifyException(exception) {
  if (exception.list) {
    return exception.list
      .map(e => {
        return stringifyException(e)
      })
      .join('\n')
  }
  let err = exception.stack || exception.toString()

  // FF / Opera do not add the message
  if (!~err.indexOf(exception.message)) {
    err = exception.message + '\n' + err
  }

  // Safari doesn't give you a stack. Let's at least provide a source line.
  if (!exception.stack && exception.sourceURL && exception.line !== undefined) {
    err += '\n(' + exception.sourceURL + ':' + exception.line + ')'
  }

  return err
}
