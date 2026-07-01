package com.virtualmind.core.network.di;

import com.virtualmind.core.network.WellnessApi;
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
public final class NetworkModule_ProvidesWellnessApiFactory implements Factory<WellnessApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvidesWellnessApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public WellnessApi get() {
    return providesWellnessApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvidesWellnessApiFactory create(
      Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvidesWellnessApiFactory(retrofitProvider);
  }

  public static WellnessApi providesWellnessApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.providesWellnessApi(retrofit));
  }
}
