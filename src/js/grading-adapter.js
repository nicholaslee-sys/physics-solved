/* Physics Solved — FRQ grading adapter.
 * All direct Anthropic API calls have been removed. Grading is pluggable:
 * with no provider set, the UI runs in self-check mode (reveal model answers +
 * self-assessment). To enable AI feedback later, set PS.grading.provider to an
 * object with an { endpoint } that points at a serverless proxy (e.g. a
 * Cloudflare Worker). No other file needs to change — see worker/README.md.
 */
(function () {
  "use strict";
  var PS = (window.PS = window.PS || {});

  PS.grading = {
    // provider: { endpoint: "https://your-worker.example.workers.dev/grade" }
    provider: null,

    /**
     * Grade a question given the student's per-part answers.
     * @param {object} question  the FRQ object (id, parts, ...)
     * @param {object} answers   map of part label -> student text
     * @returns {Promise<object>} result shape consumed by the FRQ UI:
     *   self-check:  { mode: "self-check" }
     *   graded:      { mode: "graded", parts: [{ label, score, max, feedback }],
     *                  score, max }
     */
    async grade(question, answers) {
      if (!this.provider || !this.provider.endpoint) {
        return { mode: "self-check" };
      }
      // Future: POST { question, answers } to the proxy and return its JSON.
      // The proxy holds the API key server-side; the browser never sees it.
      var res = await fetch(this.provider.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question, answers: answers })
      });
      if (!res.ok) throw new Error("Grading proxy error " + res.status);
      return res.json(); // expected: { mode: "graded", parts: [...], score, max }
    }
  };
})();
