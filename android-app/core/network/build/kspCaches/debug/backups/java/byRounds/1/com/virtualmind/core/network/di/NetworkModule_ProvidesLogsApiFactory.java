package com.virtualmind.core.network.di;

import com.virtualmind.core.network.LogsApi;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.Preconditions;
import dagger.internal.Provider;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import retrofit2.Retrofit;

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
public final class NetworkModule_ProvidesLogsApiFactory implements Factory<LogsApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvidesLogsApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public LogsApi get() {
    return providesLogsApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvidesLogsApiFactory create(Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvidesLogsApiFactory(retrofitProvider);
  }

  public static LogsApi providesLogsApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.providesLogsApi(retrofit));
  }
}
