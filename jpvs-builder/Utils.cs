using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;
using System.Globalization;

namespace jpvs.Builder {

    static class Utils {

        /// <summary>
        /// Find "jpvs" directory moving upwards in the directory tree
        /// </summary>
        public static string GetJPVSDirectory() {
            //Find "jpvs" directory
            string curDir = Directory.GetCurrentDirectory();
            while (Path.GetFileName(curDir) != "jpvs")
                curDir = Directory.GetParent(curDir).FullName;

            return curDir;
        }

        /// <summary>
        /// Get the specified top-level directory under the "jpvs" directory
        /// </summary>
        /// <param name="dirName"></param>
        /// <returns></returns>
        public static string GetJPVSDirectory(string dirName) {
            return Path.Combine(GetJPVSDirectory(), dirName);
        }

        /// <summary>
        /// Search all javascript files to build in the "javascript" directory
        /// </summary>
        /// <param name="jpvsDir"></param>
        /// <returns></returns>
        public static string[] GetJSFilesToBuild() {
            string javascriptDir = GetJPVSDirectory("javascript/src");
            return Directory.GetFiles(javascriptDir, "*.js", SearchOption.AllDirectories)
                .Where(x => !x.EndsWith("jpvs-all.js"))
                .ToArray();
        }

        public static string BundleAllFiles(string[] files) {
            var contents = files
                .OrderBy(x => {
                    //We want jpvs.js as the first file to be processed
                    if (x.EndsWith("jpvs.js"))
                        return "";
                    else
                        return x;
                })
                .Select(file => File.ReadAllText(file));

            string single = string.Join("\r\n", contents.ToArray());

            string outputName = Path.Combine(GetJPVSDirectory("javascript/src"), "jpvs-all.js");
            File.WriteAllText(outputName, single);
            return outputName;
        }

        public static void CheckNoDuplicateModuleNames(string[] files) {
            var duplicates = files
                .GroupBy(x => Path.GetFileNameWithoutExtension(x).ToLower())
                .Where(grp => grp.Count() != 1)
                .Select(grp => grp.Key)
                .ToArray();

            if (duplicates.Length != 0)
                throw new Exception("The following modules have duplicate names: " + string.Join(", ", duplicates));
        }

        public static void CopyToBuildPath(string[] files, DependsMap dependencies) {
            //Clean
            try { Directory.Delete(Utils.GetJPVSDirectory("javascript/build"), true); }
            catch { }

            //Text to replace (dependencies)
            string JPVSTREE = "var tree = " + dependencies + ";";

            //Copy all files to build/debug. Replace placeholders during process.
            foreach (string file in files) {
                var destFile = file.Replace('\\', '/').Replace("/src/", "/build/debug/");
                Directory.CreateDirectory(Path.GetDirectoryName(destFile));

                var txt = File.ReadAllText(file);
                var destTxt = txt.Replace("/* $JPVSTREE$ */", JPVSTREE);
                File.WriteAllText(destFile, destTxt);
            }

            //Now copy all files with minification by way of Yahoo.YUI.Compressor
            foreach (string file in files) {
                var srcFile = file.Replace('\\', '/').Replace("/src/", "/build/debug/");
                var destFile = file.Replace('\\', '/').Replace("/src/", "/build/min/");
                Directory.CreateDirectory(Path.GetDirectoryName(destFile));

                var txt = File.ReadAllText(srcFile);
                string destTxt = Yahoo.Yui.Compressor.JavaScriptCompressor.Compress(txt, false, true, false, false, int.MaxValue, Encoding.UTF8, CultureInfo.InvariantCulture);
                File.WriteAllText(destFile, destTxt);
            }

        }

    }
}
