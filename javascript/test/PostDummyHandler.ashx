<%@ WebHandler Language="C#" Class="PostDummyHandler" %>

using System;
using System.Web;

public class PostDummyHandler : IHttpHandler {

    public void ProcessRequest(HttpContext context) {
        //Read all and discard all, just to avoid leaving unread bytes in the connection
        byte[] buf = new byte[65536];
        using (var s = context.Request.InputStream) {
            while (s.Read(buf, 0, buf.Length) > 0) ;
        }

        //Write something
        context.Response.ContentType = "text/plain";
        context.Response.Write("Hello World " + context.Request.ContentLength);
    }

    public bool IsReusable {
        get {
            return false;
        }
    }

}