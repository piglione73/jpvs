<%@ WebHandler Language="C#" Class="PostDummyHandler" %>

using System;
using System.Web;

public class PostDummyHandler : IHttpHandler {
    
    public void ProcessRequest (HttpContext context) {
        context.Response.StatusCode = 200;
        context.Response.ContentType = "text/plain";
        context.Response.Write("Hello World");
    }
 
    public bool IsReusable {
        get {
            return false;
        }
    }

}