package com.virtualmind.core.network.di;

import com.virtualmind.core.network.OracleApi;
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
public final class NetworkModule_ProvidesOracleApiFactory implements Factory<OracleApi> {
  private final Provider<Retrofit> retrofitProvider;

  public NetworkModule_ProvidesOracleApiFactory(Provider<Retrofit> retrofitProvider) {
    this.retrofitProvider = retrofitProvider;
  }

  @Override
  public OracleApi get() {
    return providesOracleApi(retrofitProvider.get());
  }

  public static NetworkModule_ProvidesOracleApiFactory create(Provider<Retrofit> retrofitProvider) {
    return new NetworkModule_ProvidesOracleApiFactory(retrofitProvider);
  }

  public static OracleApi providesOracleApi(Retrofit retrofit) {
    return Preconditions.checkNotNullFromProvides(NetworkModule.INSTANCE.providesOracleApi(retrofit));
  }
}
