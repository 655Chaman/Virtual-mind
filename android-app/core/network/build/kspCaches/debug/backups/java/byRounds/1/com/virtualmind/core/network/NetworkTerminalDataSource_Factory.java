package com.virtualmind.core.network;

import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import okhttp3.OkHttpClient;

@ScopeMetadata
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
public final class NetworkTerminalDataSource_Factory implements Factory<NetworkTerminalDataSource> {
  private final Provider<OkHttpClient> okHttpClientProvider;

  public NetworkTerminalDataSource_Factory(Provider<OkHttpClient> okHttpClientProvider) {
    this.okHttpClientProvider = okHttpClientProvider;
  }

  @Override
  public NetworkTerminalDataSource get() {
    return newInstance(okHttpClientProvider.get());
  }

  public static NetworkTerminalDataSource_Factory create(
      Provider<OkHttpClient> okHttpClientProvider) {
    return new NetworkTerminalDataSource_Factory(okHttpClientProvider);
  }

  public static NetworkTerminalDataSource newInstance(OkHttpClient okHttpClient) {
    return new NetworkTerminalDataSource(okHttpClient);
  }
}
