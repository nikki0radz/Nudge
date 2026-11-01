package com.nicole.nudge;
import android.content.*;import android.database.Cursor;import android.database.MatrixCursor;import android.net.Uri;import android.os.*;import android.provider.OpenableColumns;import java.io.*;
public class PhotoProvider extends ContentProvider{
 public boolean onCreate(){return true;}private File file(Uri uri){if(!"capture.jpg".equals(uri.getLastPathSegment()))throw new SecurityException();return new File(getContext().getCacheDir(),"capture.jpg");}
 public String getType(Uri uri){return "image/jpeg";}public ParcelFileDescriptor openFile(Uri uri,String mode)throws FileNotFoundException{return ParcelFileDescriptor.open(file(uri),ParcelFileDescriptor.MODE_CREATE|ParcelFileDescriptor.MODE_READ_WRITE);}
 public Cursor query(Uri uri,String[] projection,String selection,String[] args,String order){MatrixCursor c=new MatrixCursor(new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE});c.addRow(new Object[]{"capture.jpg",file(uri).length()});return c;}
 public Uri insert(Uri u,ContentValues v){throw new UnsupportedOperationException();}public int delete(Uri u,String s,String[] a){return 0;}public int update(Uri u,ContentValues v,String s,String[] a){return 0;}
}
