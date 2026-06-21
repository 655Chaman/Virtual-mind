package com.virtualmind.core.network.di;

import com.virtualmind.core.network.DeenApi;
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
public final class NetworkModule_ProvidesDeenApiFactory implements Factory<DeenApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvidesDeenApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public DeenApi get() {
    return providesDeenApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvidesDeenApiFactory create(Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvidesDeenApiFactory(retrofitProvider);
  }

  public static DeenApi providesDeenApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.providesDeenApi(retrofit));
  }
}
