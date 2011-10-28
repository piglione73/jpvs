using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

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
            string javascriptDir = GetJPVSDirectory("javascript");
            return Directory.GetFiles(javascriptDir, "*.js", SearchOption.AllDirectories);
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

    }
}
