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
                var deps = jsFiles.SelectMany(x => Dependency.GetFromJS(x));

                foreach (var dep in deps)
                    Console.WriteLine("Class: {0}, Modules: {1}", dep.Class, string.Join(", ", dep.Modules));

                //The end
                Console.ForegroundColor = ConsoleColor.Green;
                Console.WriteLine("Build terminated successfully");
            }
            catch (Exception exc) {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("Error: " + exc.ToString());
                Console.WriteLine("Build terminated with errors");
            }
            finally {
                Console.ForegroundColor = originalColor;
            }
        }
    }
}
