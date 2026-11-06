/*
 * Shared validation - used by the Node server, the tests AND the browser.
 * Written as a tiny UMD module so the same rules run everywhere.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HandlyValidation = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  // DEFECT-SWITCH: `npm run defect` flips this to false, `npm run fix` flips it back.
  const REQUIRE_REG_NO = false;

  const FIELDS = ['studentName', 'regNo', 'title', 'url'];

  function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function isValidUrl(value) {
    try {
      const u = new URL(value);
      return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.length > 0;
    } catch (e) {
      return false;
    }
  }

  /** Returns { ok, errors, value } - `value` holds the trimmed fields. */
  function validateSubmission(input) {
    const src = input && typeof input === 'object' ? input : {};
    const value = {
      studentName: clean(src.studentName),
      regNo: clean(src.regNo),
      title: clean(src.title),
      url: clean(src.url),
    };
    const errors = {};

    if (!value.studentName) errors.studentName = 'Student name is required.';
    if (REQUIRE_REG_NO && !value.regNo) errors.regNo = 'Registration number is required.';
    if (!value.title) errors.title = 'Assignment title is required.';

    if (!value.url) errors.url = 'Submission URL is required.';
    else if (!isValidUrl(value.url)) errors.url = 'Enter a valid http:// or https:// link.';

    return { ok: Object.keys(errors).length === 0, errors, value };
  }

  return { FIELDS, validateSubmission, isValidUrl };
});
