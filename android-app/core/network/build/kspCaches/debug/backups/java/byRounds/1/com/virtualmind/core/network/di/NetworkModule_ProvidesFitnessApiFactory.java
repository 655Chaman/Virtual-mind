package com.virtualmind.core.network.di;

import com.virtualmind.core.network.FitnessApi;
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
public final class NetworkModule_ProvidesFitnessApiFactory implements Factory<FitnessApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvidesFitnessApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public FitnessApi get() {
    return providesFitnessApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvidesFitnessApiFactory create(
      Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvidesFitnessApiFactory(retrofitProvider);
  }

  public static FitnessApi providesFitnessApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.providesFitnessApi(retrofit));
  }
}
