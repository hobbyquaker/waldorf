const gulp = require('gulp');
const fs = require('fs-then-native');
const jsdoc2md = require('jsdoc-to-markdown');
const concat = require('gulp-concat');

gulp.task('default', ['create-api-docs', 'concat-readme']);

gulp.task('create-api-docs', function () {
    return jsdoc2md.render({files: 'index.js'})
        .then(output => fs.writeFile('docs/API.md', output))
});

gulp.task('concat-readme', ['create-api-docs'], function() {
    return gulp.src(['docs/README.header.md', 'docs/API.md', 'docs/README.footer.md'])
        .pipe(concat('README.md'))
        .pipe(gulp.dest('./'));
});
