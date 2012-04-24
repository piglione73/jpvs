using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.IO;

namespace jpvs.Builder {
    class Program {
        static void Main(string[] args) {
            ConsoleColor originalColor = Console.ForegroundColor;

            try {
                //Get javascript files to build
                var jsFiles = Utils.GetJSFilesToBuild();
                Console.WriteLine("{0} javascript files found", jsFiles.Length);

                //Check that there are no two modules with the same name
                Utils.CheckNoDuplicateModuleNames(jsFiles);

                //Find dependencies
                var depMap = DependsMap.CreateFromListOfFiles(jsFiles);

                //Create a bundle file with all js files concatenated
                string bundleName = Utils.BundleAllFiles(jsFiles);
                jsFiles = jsFiles.Concat(new string[] { bundleName }).ToArray();

                //Copy all (including bundle) to build path
                Utils.CopyToBuildPath(jsFiles, depMap);

                //Create documentation from "docs/"
                var jsDocs = Utils.GetJSDocFiles();
                Console.WriteLine("{0} documentation javascript files found", jsDocs.Length);
                Utils.BundleAllJsDocFiles(jsDocs);

                //The end
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Build terminated successfully. Press Enter to exit.");
                Console.ReadLine();
            }
            catch (Exception exc) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Error: " + exc.ToString());
                Console.WriteLine("Build terminated with errors. Press Enter to exit.");
                Console.ReadLine();
            }
            finally {
                Console.ForegroundColor = originalColor;
            }
        }
    }
}
