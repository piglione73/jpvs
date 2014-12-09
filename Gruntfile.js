module.exports = function (grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: ['build'],

        concat: {
            options: {
                separator: ';\n\n\n'
            },
            "build-js": {
                src: [
                    'javascript/src/jpvs.js',
                    'javascript/src/*.js',
                    'javascript/src/**/*.js'
                ],
                dest: 'build/jpvs-all.js'
            },
            "build-doc": {
                src: [
                    'javascript/docs/jpvs.js',
                    'javascript/docs/*.js',
                    'javascript/docs/**/*.js'
                ],
                dest: 'build/jpvs-doc.js'
            }
        },

        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'build/jpvs-all.js',
                dest: 'build/jpvs-all.min.js'
            }
        }

    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');

    grunt.registerTask('default', ['clean', 'concat', 'uglify']);

};
