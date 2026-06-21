package com.virtualmind.core.network.di;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import okhttp3.OkHttpClient;

@ScopeMetadata("javax.inject.Singleton")
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast",
    "deprecation",
    "nullness:initialization.field.uninitialized"
})
public final class NetworkModule_ProvidesOkHttpClientFactory implements Factory<OkHttpClient> {
  @Override
  public OkHttpClient get() {
    return providesOkHttpClient();
  }

  public static NetworkModule_ProvidesOkHttpClientFactory create() {
    return InstanceHolder.INSTANCE;
  }

  public static OkHttpClient providesOkHttpClient() {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.providesOkHttpClient());
  }

  private static final class InstanceHolder {
    static final NetworkModule_ProvidesOkHttpClientFactory INSTANCE = new NetworkModule_ProvidesOkHttpClientFactory();
  }
}
