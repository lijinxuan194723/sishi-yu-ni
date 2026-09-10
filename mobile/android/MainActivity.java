package com.luke.summer;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.*;
import android.widget.Toast;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;

public class MainActivity extends Activity {
 private static final String ORIGIN="https://appassets.androidplatform.net";
 private WebView web;
 private android.widget.FrameLayout viewport;
 private boolean darkSystemBars=true;
 private boolean keyboardVisible=false;
 private String systemColor="";
 private boolean contentReady=false,readyPosted=false;
 private final ExecutorService workers=Executors.newFixedThreadPool(3);
 private final ConcurrentHashMap<String,HttpURLConnection> requests=new ConcurrentHashMap<>();
 private final Set<String> active=ConcurrentHashMap.newKeySet();
 private ValueCallback<Uri[]> fileCallback;
 private GeolocationPermissions.Callback locationCallback;
 private String locationOrigin,exportText;

 @Override public void onCreate(Bundle state){
  super.onCreate(state);
  viewport=new android.widget.FrameLayout(this);viewport.setBackgroundColor(Color.rgb(33,79,76));web=new WebView(this);web.setVisibility(android.view.View.VISIBLE);web.setBackgroundColor(Color.rgb(33,79,76));viewport.addView(web,new android.widget.FrameLayout.LayoutParams(-1,-1));setContentView(viewport);showSystemBars();
  if(android.os.Build.VERSION.SDK_INT>=30){getWindow().setDecorFitsSystemWindows(false);viewport.setOnApplyWindowInsetsListener((v,insets)->{setKeyboardVisible(insets.isVisible(android.view.WindowInsets.Type.ime()));android.graphics.Insets bars=insets.getInsets(android.view.WindowInsets.Type.systemBars()|android.view.WindowInsets.Type.displayCutout()|android.view.WindowInsets.Type.ime());android.widget.FrameLayout.LayoutParams lp=(android.widget.FrameLayout.LayoutParams)web.getLayoutParams();if(lp.leftMargin!=bars.left||lp.topMargin!=bars.top||lp.rightMargin!=bars.right||lp.bottomMargin!=bars.bottom){lp.setMargins(bars.left,bars.top,bars.right,bars.bottom);web.setLayoutParams(lp);}return android.view.WindowInsets.CONSUMED;});viewport.requestApplyInsets();}
  if(android.os.Build.VERSION.SDK_INT<30)viewport.getViewTreeObserver().addOnGlobalLayoutListener(()->{android.graphics.Rect frame=new android.graphics.Rect();viewport.getWindowVisibleDisplayFrame(frame);int height=viewport.getRootView().getHeight();setKeyboardVisible(height-frame.bottom>height*.2);});
  WebSettings s=web.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setAllowFileAccess(false);s.setAllowContentAccess(true);s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);s.setGeolocationEnabled(true);s.setSupportMultipleWindows(false);
  web.addJavascriptInterface(new Bridge(),"LukeAndroid");
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView view,WebResourceRequest r){
    Uri u=r.getUrl();if(!ORIGIN.equals(u.getScheme()+"://"+u.getAuthority()))return denied();
    String path=u.getPath();if(path==null||path.contains("..")||path.contains("\\"))return denied();
    if(path.equals("/"))path="/index.html";
    try{String mime=path.endsWith(".js")?"application/javascript":path.endsWith(".css")?"text/css":path.endsWith(".html")?"text/html":path.endsWith(".jpg")?"image/jpeg":path.endsWith(".png")?"image/png":path.endsWith(".svg")?"image/svg+xml":"application/octet-stream";
     return new WebResourceResponse(mime,"UTF-8",getAssets().open("web"+path));
    }catch(IOException e){return denied();}
   }
   @Override public boolean shouldOverrideUrlLoading(WebView view,WebResourceRequest r){
    Uri u=r.getUrl();if((ORIGIN+"/").equals(u.toString()))return false;
    if(r.isForMainFrame()&&"https".equals(u.getScheme()))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(Exception ignored){}
    return true;
   }
  });
  web.setWebChromeClient(new WebChromeClient(){
   @Override public boolean onShowFileChooser(WebView view,ValueCallback<Uri[]> callback,FileChooserParams p){
    if(fileCallback!=null)fileCallback.onReceiveValue(null);fileCallback=callback;
    try{Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");startActivityForResult(i,10);}catch(Exception e){fileCallback.onReceiveValue(null);fileCallback=null;toast("无法打开文件选择器");}return true;
   }
   @Override public void onGeolocationPermissionsShowPrompt(String origin,GeolocationPermissions.Callback callback){
    if(!origin.equals(ORIGIN)&&!origin.equals(ORIGIN+"/")){callback.invoke(origin,false,false);return;}
    if(checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED){callback.invoke(origin,true,false);return;}
    locationCallback=callback;locationOrigin=origin;requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION},12);
   }
  });
  web.loadUrl(ORIGIN+"/");
 }
 private void publishKeyboard(){web.evaluateJavascript("document.documentElement.dataset.keyboard='"+keyboardVisible+"'",null);}
 private void setKeyboardVisible(boolean visible){if(keyboardVisible==visible)return;keyboardVisible=visible;publishKeyboard();}
 private void showSystemBars(){
  getWindow().clearFlags(android.view.WindowManager.LayoutParams.FLAG_FULLSCREEN);
  if(android.os.Build.VERSION.SDK_INT>=30){android.view.WindowInsetsController c=getWindow().getInsetsController();if(c!=null){c.show(android.view.WindowInsets.Type.systemBars());int mask=android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;c.setSystemBarsAppearance(darkSystemBars?0:mask,mask);}}
  else getWindow().getDecorView().setSystemUiVisibility(darkSystemBars?0:android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
 }
 @Override public void onWindowFocusChanged(boolean focused){super.onWindowFocusChanged(focused);if(focused)showSystemBars();}
 private WebResourceResponse denied(){return new WebResourceResponse("text/plain","UTF-8",403,"Forbidden",Collections.emptyMap(),new ByteArrayInputStream(new byte[0]));}
 private void toast(String text){runOnUiThread(()->Toast.makeText(this,text,Toast.LENGTH_LONG).show());}
 @Override public void onRequestPermissionsResult(int request,String[] permissions,int[] results){super.onRequestPermissionsResult(request,permissions,results);if(request==12&&locationCallback!=null){locationCallback.invoke(locationOrigin,checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED,false);locationCallback=null;}}
 @Override protected void onActivityResult(int request,int result,Intent data){super.onActivityResult(request,result,data);
  if(request==10&&fileCallback!=null){fileCallback.onReceiveValue(result==RESULT_OK&&data!=null&&data.getData()!=null?new Uri[]{data.getData()}:null);fileCallback=null;}
  if(request==11){String text=exportText;exportText=null;if(result==RESULT_OK&&data!=null&&text!=null){Uri uri=data.getData();workers.execute(()->{try{try(OutputStream out=getContentResolver().openOutputStream(uri)){if(out==null)throw new IOException();out.write(text.getBytes(StandardCharsets.UTF_8));}runOnUiThread(()->{if(!isDestroyed())web.evaluateJavascript("localStorage.setItem('luke-backup-confirmed',Date.now().toString());window.dispatchEvent(new Event('luke-backup-saved'))",null);});toast("备份已保存");}catch(Exception e){toast("备份未保存，请重试");}});}}
 }
 @Override public void onBackPressed(){if(keyboardVisible){((android.view.inputmethod.InputMethodManager)getSystemService(INPUT_METHOD_SERVICE)).hideSoftInputFromWindow(web.getWindowToken(),0);web.evaluateJavascript("document.activeElement instanceof HTMLElement&&document.activeElement.blur()",null);return;}web.evaluateJavascript("!!(window.__lukeBack&&window.__lukeBack())",handled->{if(!"true".equals(handled))moveTaskToBack(true);});}
 @Override protected void onDestroy(){for(HttpURLConnection c:requests.values())c.disconnect();workers.shutdownNow();web.removeJavascriptInterface("LukeAndroid");web.destroy();super.onDestroy();}
 private void deliver(String id,int status,String body){if(!active.remove(id))return;String script="window.__lukeNetwork&&window.__lukeNetwork("+JSONObject.quote(id)+","+status+","+JSONObject.quote(body)+")";runOnUiThread(()->{if(!isDestroyed())web.evaluateJavascript(script,null);});}
 private void streamPart(String id,int status,String type,String text,boolean done){if(!active.contains(id))return;if(done)active.remove(id);String script="window.__lukeStreaming&&window.__lukeStreaming("+JSONObject.quote(id)+","+status+","+JSONObject.quote(type)+","+JSONObject.quote(text)+","+done+")";runOnUiThread(()->{if(!isDestroyed())web.evaluateJavascript(script,null);});}
 private void applySystemTheme(){String color=systemColor.isEmpty()?"#214f4c":systemColor;boolean dark=darkSystemBars;int value=Color.parseColor(color);viewport.setBackgroundColor(value);getWindow().setStatusBarColor(value);getWindow().setNavigationBarColor(value);if(android.os.Build.VERSION.SDK_INT>=30){android.view.WindowInsetsController c=getWindow().getInsetsController();if(c!=null){int mask=android.view.WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS|android.view.WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS;c.setSystemBarsAppearance(dark?0:mask,mask);}}else getWindow().getDecorView().setSystemUiVisibility(dark?0:android.view.View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR|android.view.View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);}
 public class Bridge {
  @JavascriptInterface public String defaultModel(){try(InputStream in=getAssets().open("personal-model.json");ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] buffer=new byte[1024];int n;while((n=in.read(buffer))!=-1)out.write(buffer,0,n);return out.toString("UTF-8");}catch(Exception ignored){return "{}";}}
  @JavascriptInterface public void haptic(){runOnUiThread(()->{if(!isDestroyed())web.performHapticFeedback(android.view.HapticFeedbackConstants.KEYBOARD_TAP);});}
  @JavascriptInterface public void pageReady(){
   runOnUiThread(()->{if(isDestroyed()||readyPosted)return;readyPosted=true;
    web.postVisualStateCallback(0,new WebView.VisualStateCallback(){@Override public void onComplete(long id){if(isDestroyed())return;contentReady=true;publishKeyboard();applySystemTheme();web.setVisibility(android.view.View.VISIBLE);}});
   });
  }
  @JavascriptInterface public void systemTheme(String color,boolean dark){
   if(color==null||!color.matches("#[0-9a-fA-F]{6}"))return;
   runOnUiThread(()->{if(isDestroyed()||(color.equals(systemColor)&&dark==darkSystemBars))return;systemColor=color;darkSystemBars=dark;if(contentReady)applySystemTheme();});
  }

  @JavascriptInterface public void geocode(String id,double lat,double lon){
   if(id==null||id.length()>80||Double.isNaN(lat)||Double.isNaN(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return;
   workers.execute(()->{String place="";try{
    android.location.Geocoder g=new android.location.Geocoder(MainActivity.this,Locale.SIMPLIFIED_CHINESE);
    java.util.List<android.location.Address> result=g.getFromLocation(lat,lon,1);
    if(result!=null&&!result.isEmpty()){android.location.Address a=result.get(0);String district="";
     for(String part:new String[]{a.getSubAdminArea(),a.getLocality(),a.getSubLocality()})if(part!=null&&part.matches(".*[区县旗]$")&&!part.endsWith("自治区")&&!part.endsWith("社区")&&!part.endsWith("小区")){district=part;break;}
     if(!district.isEmpty()){String city=a.getLocality();place=city!=null&&!city.equals(district)?city+" · "+district:district;}
    }
   }catch(Exception ignored){}
   String script="window.__lukeGeocode&&window.__lukeGeocode("+JSONObject.quote(id)+","+JSONObject.quote(place)+")";
   runOnUiThread(()->{if(!isDestroyed())web.evaluateJavascript(script,null);});
   });
  }

  @JavascriptInterface public void request(String id,String address,String method,String headers,String body){perform(id,address,method,headers,body,false);}
  @JavascriptInterface public void requestStream(String id,String address,String method,String headers,String body){perform(id,address,method,headers,body,true);}
  private void perform(String id,String address,String method,String headers,String body,boolean streaming){
   if(id==null||id.length()>80||active.size()>=6)return;active.add(id);
   workers.execute(()->{HttpURLConnection c=null;try{
    URL url=new URL(address);if(!"https".equals(url.getProtocol())||url.getUserInfo()!=null||url.getHost().isEmpty()||(!method.equals("GET")&&!method.equals("POST"))||body.length()>600000||headers.length()>12000)throw new IOException();
    c=(HttpURLConnection)url.openConnection();requests.put(id,c);if(!active.contains(id))return;
    c.setInstanceFollowRedirects(false);c.setConnectTimeout(20000);c.setReadTimeout(80000);c.setRequestMethod(method);c.setRequestProperty("User-Agent","FourSeasonsLuke/1.4 (com.luke.summer)");c.setRequestProperty("Accept",streaming?"text/event-stream":"application/json");
    JSONObject h=new JSONObject(headers);for(Iterator<String> it=h.keys();it.hasNext();){String key=it.next();if(key.equalsIgnoreCase("authorization")||key.equalsIgnoreCase("content-type"))c.setRequestProperty(key,h.getString(key));}
    if(method.equals("POST")){c.setDoOutput(true);try(OutputStream out=c.getOutputStream()){out.write(body.getBytes(StandardCharsets.UTF_8));}}
    int status=c.getResponseCode();InputStream stream=status>=400?c.getErrorStream():c.getInputStream();if(streaming){String type=c.getContentType();streamPart(id,status,type,"",false);if(stream!=null)try(Reader reader=new InputStreamReader(stream,StandardCharsets.UTF_8)){char[] chars=new char[1024];int n,total=0;while((n=reader.read(chars))!=-1){if(!active.contains(id))return;total+=n;if(total>2000000)throw new IOException();streamPart(id,status,type,new String(chars,0,n),false);}}streamPart(id,status,type,"",true);return;}ByteArrayOutputStream bytes=new ByteArrayOutputStream();if(stream!=null)try(InputStream input=stream){byte[] buf=new byte[8192];int n;while((n=input.read(buf))!=-1){if(bytes.size()+n>2000000)throw new IOException();bytes.write(buf,0,n);}}
    deliver(id,status,bytes.toString("UTF-8"));
   }catch(Exception e){if(streaming)streamPart(id,0,"","",true);else deliver(id,0,"");}finally{requests.remove(id);if(c!=null)c.disconnect();}});
  }
  @JavascriptInterface public void cancel(String id){active.remove(id);HttpURLConnection c=requests.remove(id);if(c!=null)c.disconnect();}
  @JavascriptInterface public void saveBackup(String name,String text){if(text==null||text.length()>16000000){toast("备份过大，暂时无法导出");return;}runOnUiThread(()->{if(exportText!=null){toast("请先完成当前导出");return;}exportText=text;try{Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(Intent.EXTRA_TITLE,name.replaceAll("[\\\\/:*?\"<>|]","_"));startActivityForResult(i,11);}catch(Exception e){exportText=null;toast("无法打开保存窗口");}});}
 }
}

